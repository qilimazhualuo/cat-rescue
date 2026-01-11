import { createPerson } from '~/server/utils/db'
import type { Person } from '~/server/utils/db'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async event => {
    const body = await readBody(event)

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
