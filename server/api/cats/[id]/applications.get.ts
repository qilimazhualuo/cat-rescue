import { getAdoptionApplicationsByCatId } from '~/server/utils/db'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const applications = await getAdoptionApplicationsByCatId(parseInt(id))

    return applications
})
