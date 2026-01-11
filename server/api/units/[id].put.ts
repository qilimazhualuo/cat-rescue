import { updateUnit, getAllUnits } from '~/server/utils/db'
import type { Unit } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const body = await readBody(event)

    // 如果更新名称，检查是否与其他单位重复
    if (body.name) {
        const existingUnits = await getAllUnits()
        if (existingUnits.some(u => u.name === body.name && u.id !== parseInt(id))) {
            throw createError({
                statusCode: 400,
                message: '单位名称已存在',
            })
        }
    }

    const updates: Partial<Unit> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.code !== undefined) updates.code = body.code
    if (body.address !== undefined) updates.address = body.address
    if (body.location !== undefined) updates.location = body.location
    if (body.contact_person !== undefined) updates.contact_person = body.contact_person
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.email !== undefined) updates.email = body.email
    if (body.description !== undefined) updates.description = body.description
    if (body.status !== undefined) updates.status = body.status

    const updated = await updateUnit(parseInt(id), updates)

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
