import { updatePersonPassword } from '~/server/utils/db'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const body = await readBody(event)

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
    const success = await updatePersonPassword(parseInt(id), hashedPassword)

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
