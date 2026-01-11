import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { auth } from './auth'
import authRouter from './router/auth'
import catsRouter from './router/cats'
import personsRouter from './router/persons'
import rolesRouter from './router/roles'
import unitsRouter from './router/units'
import adoptionApplicationsRouter from './router/adoption-applications'
import menuRouter from './router/menu'
import pagesRouter from './router/pages'
import uploadsRouter from './router/uploads'
import { logger } from '@grotto/logysia'
import { initDb } from './db/db'

// 不需要鉴权的公开接口
const publicPaths = ['/api/auth/login', '/swagger', '/swagger/json', '/uploads', '/api/cats', '/api/uploads']

// 初始化数据库
initDb().catch((error) => {
    console.error('数据库初始化失败，服务器将继续启动:', error)
})

const app = new Elysia()
    .use(cors())
    .use(swagger())
    .use(auth)
    .onBeforeHandle(async ({ path, getCurrentUser, set }) => {
        // 检查路径是否为公开接口
        const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath))

        if (isPublicPath) {
            return // 公开接口，跳过认证
        }

        // 需要认证的接口，验证用户身份
        try {
            await getCurrentUser()
        } catch (error) {
            set.status = 401
            return {
                message: '未授权访问，请先登录',
            }
        }
    })
    .use(
        logger({
            logIP: false,
            writer: {
                write(msg: string) {
                    console.log(msg)
                },
            },
        }),
    )
    .use(authRouter) // 认证相关路由
    .use(catsRouter) // 猫咪相关路由
    .use(personsRouter) // 人员相关路由
    .use(rolesRouter) // 角色相关路由
    .use(unitsRouter) // 单位相关路由
    .use(adoptionApplicationsRouter) // 领养申请相关路由
    .use(menuRouter) // 菜单路由
    .use(pagesRouter) // 页面路由
    .use(uploadsRouter) // 文件上传路由
    .onError(({ code, error, set }) => {
        // 统一错误处理，保持原有格式
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        if (code === 'NOT_FOUND') {
            set.status = 404
            return { message: '接口不存在' }
        }
        if (code === 'UNAUTHORIZED' || errorMessage === '未授权访问，请先登录') {
            set.status = 401
            return { message: errorMessage || '未授权访问，请先登录' }
        }
        if ((error as any).statusCode) {
            set.status = (error as any).statusCode
            return { message: errorMessage }
        }
        set.status = 500
        return { message: errorMessage || '服务器错误' }
    })
    .listen(3001) // 使用 3001 端口，避免与前端冲突

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`)

