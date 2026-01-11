export default defineNuxtRouteMiddleware(async (to, from) => {
    // 允许访问登录页面、首页（猫咪列表）、猫咪详情页和领养申请页
    // 注意：/cats/[id] 是详情页，不需要登录；但 /cats 是管理页面，需要登录
    if (
        to.path === '/login' ||
        to.path === '/' ||
        (to.path.startsWith('/cats/') && /^\/cats\/\d+$/.test(to.path)) || // 只允许 /cats/[id] 格式的详情页
        to.path.startsWith('/adoption-apply/') // 领养申请页
    ) {
        return
    }

    // 在客户端检查认证状态
    if (process.client) {
        const { token, user } = useAuth()
        // Pinia 持久化插件会自动从 localStorage 加载 token

        if (!token.value) {
            // 未登录，跳转到登录页
            return navigateTo('/login')
        }

        // 如果有缓存的用户信息，使用缓存的；否则从 API 获取
        let currentUser = user.value
        if (!currentUser) {
            try {
                currentUser = await $fetch('/api/auth/me')
                // 如果获取成功，更新到 store
                if (currentUser) {
                    const authStore = useAuthStore()
                    authStore.setToken(authStore.token || '', currentUser)
                }
            } catch (error) {
                // token 无效，清除并跳转到登录页
                const { clearToken } = useAuth()
                clearToken()
                return navigateTo('/login')
            }
        }

        // 管理员拥有所有权限
        if (currentUser?.role_name === 'admin') {
            return
        }

        // 检查用户是否有权限访问该页面
        try {
            const pages = await $fetch('/api/pages')
            const userPages = await $fetch(`/api/roles/${currentUser.role_id}`)

            const hasPermission = userPages.pages?.some((pageId: number) => {
                const page = pages.find((p: any) => p.id === pageId)
                return page && to.path.startsWith(page.path)
            })

            if (!hasPermission) {
                // 没有权限，跳转到首页
                return navigateTo('/')
            }
        } catch (error) {
            console.error('权限检查失败:', error)
            // 权限检查失败，允许访问（避免阻塞）
        }
    }
})
