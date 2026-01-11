import { searchCats } from '~/server/utils/db'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    const query = getQuery(event)

    // 管理界面需要登录，获取当前登录用户信息
    const user = await getAuthUser(event, true)

    // 根据用户身份限制单位
    let unitId: number | undefined = undefined
    // 管理员可以看到所有数据
    if (user.role_name !== 'admin') {
        // 普通用户只能看到本单位的猫咪
        unitId = user.unit_id || undefined
    }

    const result = await searchCats({
        category: query.category as string,
        adoption_status: query.adoption_status as string,
        search: query.search as string,
        unit_id: unitId, // 根据用户身份限制单位
        page: parseInt(query.page as string) || 1,
        pageSize: parseInt(query.pageSize as string) || 20,
    })

    return result
})
