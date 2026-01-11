import { getRoleById } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const role = await getRoleById(parseInt(id))

    if (!role) {
        throw createError({
            statusCode: 404,
            message: '未找到该角色',
        })
    }

    return role
})
