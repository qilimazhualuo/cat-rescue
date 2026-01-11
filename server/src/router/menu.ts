import { Elysia } from 'elysia'
import { auth } from '../auth'
import { getRoleById, getAllPages } from '../db/db'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

export default new Elysia({ prefix: '/api' })
    .use(auth)
    // GET /api/menu - 获取菜单
    .get('/menu', async ({ getCurrentUser }) => {
        const user = await getCurrentUser()

        try {
            // 管理员拥有所有菜单权限
            if (user.role_name === 'admin') {
                const allPages = await getAllPages()
                return allPages.map((page) => ({
                    id: page.id,
                    name: page.name,
                    path: page.path,
                    description: page.description,
                }))
            }

            // 普通用户根据角色获取菜单
            if (user.role_id) {
                const role = await getRoleById(user.role_id)
                if (role && role.pages && role.pages.length > 0) {
                    const allPages = await getAllPages()
                    return allPages
                        .filter((page) => role.pages!.includes(page.id!))
                        .map((page) => ({
                            id: page.id,
                            name: page.name,
                            path: page.path,
                            description: page.description,
                        }))
                }
            }

            return []
        } catch (error) {
            throw createError({
                statusCode: 401,
                message: '获取菜单失败',
            })
        }
    })

