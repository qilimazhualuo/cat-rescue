import { Elysia } from 'elysia'
import { auth } from '../auth'
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole } from '../db/db'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

export default new Elysia({ prefix: '/api/roles' })
    .use(auth)
    // GET /api/roles - 获取所有角色
    .get('/', async () => {
        const roles = await getAllRoles()
        return roles
    })
    // POST /api/roles - 创建角色
    .post('/', async ({ body }) => {
        if (!body.name) {
            throw createError({
                statusCode: 400,
                message: '角色名称不能为空',
            })
        }

        const newRole = await createRole({
            name: body.name,
            description: body.description,
            pages: body.pages || [],
        })

        return {
            id: newRole.id,
            message: '创建成功',
        }
    })
    // GET /api/roles/:id - 获取单个角色信息
    .get('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const role = await getRoleById(id)
        if (!role) {
            throw createError({
                statusCode: 404,
                message: '未找到该角色',
            })
        }

        return role
    })
    // PUT /api/roles/:id - 更新角色
    .put('/:id', async ({ params, body }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const updates: any = {}
        if (body.name !== undefined) updates.name = body.name
        if (body.description !== undefined) updates.description = body.description
        if (body.pages !== undefined) updates.pages = body.pages

        const updated = await updateRole(id, updates)
        if (!updated) {
            throw createError({
                statusCode: 404,
                message: '未找到该角色',
            })
        }

        return {
            message: '更新成功',
        }
    })
    // DELETE /api/roles/:id - 删除角色
    .delete('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const success = await deleteRole(id)
        if (!success) {
            throw createError({
                statusCode: 404,
                message: '未找到该角色',
            })
        }

        return {
            message: '删除成功',
        }
    })

