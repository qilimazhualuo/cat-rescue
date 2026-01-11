import { deleteCat, getCatById } from '~/server/utils/db'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    // 检查权限：非管理员只能删除自己单位的猫咪
    const user = await getAuthUser(event)

    if (user.role_name !== 'admin') {
        // 非管理员需要检查猫咪是否属于自己的单位
        const cat = await getCatById(parseInt(id))
        if (!cat) {
            throw createError({
                statusCode: 404,
                message: '未找到该猫咪信息',
            })
        }
        if (cat.unit_id !== user.unit_id) {
            throw createError({
                statusCode: 403,
                message: '无权删除该猫咪信息',
            })
        }
    }

    const success = await deleteCat(parseInt(id))

    if (!success) {
        throw createError({
            statusCode: 404,
            message: '未找到该猫咪信息',
        })
    }

    return {
        message: '删除成功',
    }
})
