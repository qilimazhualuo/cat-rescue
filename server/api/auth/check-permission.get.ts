import { checkPagePermission } from '~/server/utils/db'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    const query = getQuery(event)
    const pagePath = query.path as string

    if (!pagePath) {
        throw createError({
            statusCode: 400,
            message: '缺少路径参数',
        })
    }

    // 获取当前登录用户
    const user = await getAuthUser(event)

    // 管理员拥有所有权限
    if (user.role_name === 'admin') {
        return { hasPermission: true }
    }

    // 检查权限
    const hasPermission = await checkPagePermission(user.role_id, pagePath)

    return { hasPermission }
})
