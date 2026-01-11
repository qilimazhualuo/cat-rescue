import { Elysia } from 'elysia'
import { auth } from '../auth'
import { searchUnits, getUnitById, createUnit, updateUnit, deleteUnit, getAllUnits } from '../db/db'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

export default new Elysia({ prefix: '/api/units' })
    .use(auth)
    // GET /api/units - 获取单位列表
    .get('/', async ({ query, getCurrentUser }) => {
        let unitId: number | undefined = undefined
        try {
            const user = await getCurrentUser()
            // 如果用户有单位且不是管理员，只显示该单位
            if (user && user.role_id && user.role_name !== 'admin') {
                unitId = user.unit_id || undefined
                // 如果指定了 unit_id，只返回该单位
                if (unitId) {
                    const unit = await getUnitById(unitId)
                    return {
                        data: unit ? [unit] : [],
                        total: unit ? 1 : 0,
                        page: 1,
                        pageSize: 1,
                        totalPages: unit ? 1 : 0,
                    }
                }
            }
        } catch {
            // 未登录或解析失败，显示所有单位
        }

        const result = await searchUnits({
            search: query.search as string,
            status: query.status as string,
            page: parseInt(query.page as string) || 1,
            pageSize: parseInt(query.pageSize as string) || 20,
        })

        return result
    })
    // POST /api/units - 创建单位
    .post('/', async ({ body }) => {
        const bodyData = body as any
        // 验证必填字段
        if (!bodyData.name) {
            throw createError({
                statusCode: 400,
                message: '单位名称不能为空',
            })
        }

        // 检查名称是否已存在
        const existingUnits = await getAllUnits()
        if (existingUnits.some((u) => u.name === bodyData.name && u.id !== bodyData.id)) {
            throw createError({
                statusCode: 400,
                message: '单位名称已存在',
            })
        }

        const newUnit = await createUnit({
            name: bodyData.name,
            code: bodyData.code,
            address: bodyData.address,
            location: bodyData.location,
            contact_person: bodyData.contact_person,
            phone: bodyData.phone,
            email: bodyData.email,
            description: bodyData.description,
            status: bodyData.status || 'active',
        })

        return {
            id: newUnit.id,
            message: '创建成功',
        }
    })
    // GET /api/units/:id - 获取单个单位信息
    .get('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const unit = await getUnitById(id)
        if (!unit) {
            throw createError({
                statusCode: 404,
                message: '未找到该单位信息',
            })
        }

        return unit
    })
    // PUT /api/units/:id - 更新单位
    .put('/:id', async ({ params, body }) => {
        const bodyData = body as any
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        // 如果更新名称，检查是否与其他单位重复
        if (bodyData.name) {
            const existingUnits = await getAllUnits()
            if (existingUnits.some((u) => u.name === bodyData.name && u.id !== id)) {
                throw createError({
                    statusCode: 400,
                    message: '单位名称已存在',
                })
            }
        }

        const updates: any = {}

        if (bodyData.name !== undefined) updates.name = bodyData.name
        if (bodyData.code !== undefined) updates.code = bodyData.code
        if (bodyData.address !== undefined) updates.address = bodyData.address
        if (bodyData.location !== undefined) updates.location = bodyData.location
        if (bodyData.contact_person !== undefined) updates.contact_person = bodyData.contact_person
        if (bodyData.phone !== undefined) updates.phone = bodyData.phone
        if (bodyData.email !== undefined) updates.email = bodyData.email
        if (bodyData.description !== undefined) updates.description = bodyData.description
        if (bodyData.status !== undefined) updates.status = bodyData.status

        const updated = await updateUnit(id, updates)
        if (!updated) {
            throw createError({
                statusCode: 404,
                message: '未找到该单位信息',
            })
        }

        return {
            message: '更新成功',
        }
    })
    // DELETE /api/units/:id - 删除单位
    .delete('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const success = await deleteUnit(id)
        if (!success) {
            throw createError({
                statusCode: 404,
                message: '未找到该单位信息',
            })
        }

        return {
            message: '删除成功',
        }
    })

