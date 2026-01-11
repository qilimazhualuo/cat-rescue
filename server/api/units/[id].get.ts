import { getUnitById } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const unit = await getUnitById(parseInt(id))

    if (!unit) {
        throw createError({
            statusCode: 404,
            message: '未找到该单位信息',
        })
    }

    return unit
})
