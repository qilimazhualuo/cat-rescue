import { Elysia } from 'elysia'
import { auth } from '../auth'
import {
    searchPersons,
    getPersonById,
    createPerson,
    updatePerson,
    updatePersonPassword,
    deletePerson,
} from '../db/db'
import bcrypt from 'bcryptjs'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

export default new Elysia({ prefix: '/api/persons' })
    .use(auth)
    // GET /api/persons - 获取人员列表
    .get('/', async ({ query, getCurrentUser }) => {
        let unitId: number | undefined = undefined
        try {
            const user = await getCurrentUser()
            // 如果用户有单位且不是管理员，只显示该单位的人员
            if (user && user.role_id && user.role_name !== 'admin') {
                unitId = user.unit_id || undefined
            }
        } catch {
            // 未登录或解析失败，不限制数据范围
        }

        // 如果查询参数中指定了 unit_id，使用查询参数的值
        const finalUnitId = query.unit_id ? parseInt(query.unit_id as string) : unitId

        const result = await searchPersons({
            search: query.search as string,
            status: query.status as string,
            unit_id: finalUnitId,
            gender: query.gender as string,
            page: parseInt(query.page as string) || 1,
            pageSize: parseInt(query.pageSize as string) || 20,
        })

        return result
    })
    // POST /api/persons - 创建人员
    .post('/', async ({ body }) => {
        // 验证必填字段
        if (!body.name) {
            throw createError({
                statusCode: 400,
                message: '姓名不能为空',
            })
        }

        if (!body.unit_id) {
            throw createError({
                statusCode: 400,
                message: '所属单位不能为空',
            })
        }

        if (!body.role_id) {
            throw createError({
                statusCode: 400,
                message: '角色不能为空',
            })
        }

        if (!body.username || body.username.trim() === '') {
            throw createError({
                statusCode: 400,
                message: '用户名不能为空',
            })
        }

        if (!body.password || body.password.trim() === '') {
            throw createError({
                statusCode: 400,
                message: '密码不能为空',
            })
        }

        if (body.password.length < 6) {
            throw createError({
                statusCode: 400,
                message: '密码长度至少6位',
            })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(body.password, 10)

        const newPerson = await createPerson({
            name: body.name,
            id_card: body.id_card,
            phone: body.phone,
            gender: body.gender,
            address: body.address,
            unit_id: body.unit_id ? parseInt(body.unit_id) : undefined,
            notes: body.notes,
            role_id: body.role_id ? parseInt(body.role_id) : undefined,
            username: body.username,
            password: hashedPassword,
        })

        return {
            id: newPerson.id,
            message: '创建成功',
        }
    })
    // GET /api/persons/:id - 获取单个人员信息
    .get('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const person = await getPersonById(id)
        if (!person) {
            throw createError({
                statusCode: 404,
                message: '未找到该人员信息',
            })
        }

        return person
    })
    // PUT /api/persons/:id - 更新人员信息
    .put('/:id', async ({ params, body }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        // 验证必填字段
        if (body.unit_id !== undefined && !body.unit_id) {
            throw createError({
                statusCode: 400,
                message: '所属单位不能为空',
            })
        }

        if (body.role_id !== undefined && !body.role_id) {
            throw createError({
                statusCode: 400,
                message: '角色不能为空',
            })
        }

        if (body.username !== undefined && (!body.username || body.username.trim() === '')) {
            throw createError({
                statusCode: 400,
                message: '用户名不能为空',
            })
        }

        if (!body.password || body.password.trim() === '') {
            throw createError({
                statusCode: 400,
                message: '密码不能为空',
            })
        }

        if (body.password.length < 6) {
            throw createError({
                statusCode: 400,
                message: '密码长度至少6位',
            })
        }

        const updates: any = {}

        if (body.name !== undefined) updates.name = body.name
        if (body.id_card !== undefined) updates.id_card = body.id_card
        if (body.phone !== undefined) updates.phone = body.phone
        if (body.gender !== undefined) updates.gender = body.gender
        if (body.address !== undefined) updates.address = body.address
        if (body.unit_id !== undefined) updates.unit_id = body.unit_id ? parseInt(body.unit_id) : null
        if (body.notes !== undefined) updates.notes = body.notes
        if (body.role_id !== undefined) updates.role_id = body.role_id ? parseInt(body.role_id) : null
        if (body.username !== undefined) updates.username = body.username

        // 加密并更新密码
        const hashedPassword = await bcrypt.hash(body.password, 10)
        await updatePersonPassword(id, hashedPassword)

        const updated = await updatePerson(id, updates)
        if (!updated) {
            throw createError({
                statusCode: 404,
                message: '未找到该人员信息',
            })
        }

        return {
            message: '更新成功',
        }
    })
    // POST /api/persons/:id/set-password - 设置密码
    .post('/:id/set-password', async ({ params, body }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        if (!body.password) {
            throw createError({
                statusCode: 400,
                message: '密码不能为空',
            })
        }

        if (body.password.length < 6) {
            throw createError({
                statusCode: 400,
                message: '密码长度至少6位',
            })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(body.password, 10)

        // 更新密码
        const success = await updatePersonPassword(id, hashedPassword)
        if (!success) {
            throw createError({
                statusCode: 404,
                message: '未找到该人员信息',
            })
        }

        return {
            message: '密码设置成功',
        }
    })
    // DELETE /api/persons/:id - 删除人员
    .delete('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const success = await deletePerson(id)
        if (!success) {
            throw createError({
                statusCode: 404,
                message: '未找到该人员信息',
            })
        }

        return {
            message: '删除成功',
        }
    })

