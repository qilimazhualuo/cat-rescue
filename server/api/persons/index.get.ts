import { searchPersons } from '~/server/utils/db'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    const query = getQuery(event)

    // 获取当前登录用户信息（如果有）
    let unitId: number | undefined = undefined
    try {
        const user = await getAuthUser(event, false)
        // 如果用户有单位且不是管理员，只显示该单位的人员
        if (user && user.role_id && user.role_name !== 'admin') {
            unitId = user.unit_id || undefined
        }
    } catch (error) {
        // 未登录或解析失败，不限制数据范围
    }

    // 如果查询参数中指定了 unit_id，使用查询参数的值
    const finalUnitId = query.unit_id ? parseInt(query.unit_id as string) : unitId

    const result = await searchPersons({
        search: query.search as string,
        unit_id: finalUnitId,
        gender: query.gender as string,
        page: parseInt(query.page as string) || 1,
        pageSize: parseInt(query.pageSize as string) || 20,
    })

    return result
})
