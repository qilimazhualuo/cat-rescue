import { initAdminAccount } from '~/server/utils/init-admin'

/**
 * 初始化默认管理员账户
 * POST /api/admin/init
 * 
 * 默认账户信息：
 * - 用户名: admin
 * - 密码: admin123
 * 
 * ⚠️ 安全提示：请在生产环境中运行后立即修改密码！
 */
export default defineEventHandler(async event => {
    try {
        const result = await initAdminAccount()
        return {
            success: true,
            ...result,
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message || '初始化管理员账户失败',
        })
    }
})

