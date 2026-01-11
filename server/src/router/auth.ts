import { Elysia } from 'elysia'
import { auth, AuthUser } from '../auth'
import { getPersonByUsername, updateLastLogin, checkPagePermission } from '../db/db'
import bcrypt from 'bcryptjs'
import { redisClient } from '../db/redis'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

const REDIS_TOKEN_PREFIX = 'auth:token:'
const REDIS_USER_PREFIX = 'auth:user:'

export default new Elysia({ prefix: '/api/auth' })
    .use(auth)
    .post('/login', async ({ body, signUser }) => {
        const { username, password } = body as { username?: string; password?: string }

        if (!username || !password) {
            return {
                code: 400,
                message: '用户名和密码不能为空',
            }
        }

        // 查找用户
        const person = await getPersonByUsername(username)

        if (!person) {
            throw createError({
                statusCode: 401,
                message: '用户名或密码错误',
            })
        }

        // 检查状态
        if (person.status !== 'active') {
            throw createError({
                statusCode: 403,
                message: '账户已被禁用',
            })
        }

        // 验证密码
        if (!person.password) {
            throw createError({
                statusCode: 401,
                message: '该账户未设置密码',
            })
        }

        const isValidPassword = await bcrypt.compare(password, person.password)

        if (!isValidPassword) {
            throw createError({
                statusCode: 401,
                message: '用户名或密码错误',
            })
        }

        // 更新最后登录时间
        await updateLastLogin(person.id!)

        // 创建用户信息（不包含密码）
        const user: AuthUser = {
            id: person.id!,
            username: person.username!,
            name: person.name,
            role: person.role || 'user',
            role_id: person.role_id,
            role_name: person.role_name,
            unit_id: person.unit_id,
            unit_name: person.unit_name,
        }

        // 如果用户已有 token，先删除旧的（实现单点登录）
        if (person.id) {
            try {
                const userKey = `${REDIS_USER_PREFIX}${person.id}`
                const oldToken = await redisClient.get(userKey)
                if (oldToken) {
                    const tokenKey = `${REDIS_TOKEN_PREFIX}${oldToken}`
                    await redisClient.del(tokenKey)
                    await redisClient.del(userKey)
                }
            } catch (error) {
                // 忽略错误，继续生成新 token
                console.error('删除旧 token 失败:', error)
            }
        }

        // 生成 token
        const { token } = await signUser(user)

        // 保持原有响应格式
        return {
            message: '登录成功',
            token,
            user,
        }
    })
    .post('/logout', async ({ signOut }) => {
        const result = await signOut()
        // 保持原有响应格式
        return {
            message: result.message || '注销成功'
        }
    })
    .get('/me', async ({ getCurrentUser }) => {
        const user = await getCurrentUser()
        // 保持原有响应格式，直接返回用户对象
        return user
    })
    .get('/check-permission', async ({ query, getCurrentUser }) => {
        try {
            const user = await getCurrentUser()
            const { pagePath } = query as { pagePath?: string }

            if (!pagePath) {
                return {
                    code: 400,
                    message: '缺少 pagePath 参数',
                }
            }

            // 管理员拥有所有权限
            if (user.role_name === 'admin') {
                return {
                    code: 0,
                    message: '有权限',
                    data: { hasPermission: true },
                }
            }

            // 如果没有 role_id，则没有权限
            if (!user.role_id) {
                return {
                    code: 0,
                    message: '无权限',
                    data: { hasPermission: false },
                }
            }

            // 检查权限
            const hasPermission = await checkPagePermission(user.role_id, pagePath)

            // 保持原有响应格式
            return {
                hasPermission,
            }
        } catch (error) {
            return {
                code: 401,
                message: '会话验证失败',
            }
        }
    })

