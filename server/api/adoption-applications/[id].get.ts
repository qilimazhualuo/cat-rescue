import { getAdoptionApplicationById } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const application = await getAdoptionApplicationById(parseInt(id))

    if (!application) {
        throw createError({
            statusCode: 404,
            message: '未找到该领养申请',
        })
    }

    return application
})
