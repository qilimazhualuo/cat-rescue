export default defineNuxtPlugin(() => {
    // 拦截所有 $fetch 请求，自动添加 Authorization header
    if (process.client) {
        const authStore = useAuthStore()
        // Pinia 持久化插件会自动从 localStorage 加载 token，无需手动调用

        const originalFetch = $fetch

        // 重写全局 $fetch
        ;(globalThis as any).$fetch = async (url: string, options: any = {}) => {
            // 从 Pinia store 获取 token（内存中，更快）
            if (authStore.token) {
                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer ${authStore.token}`,
                }
            }

            try {
                return await originalFetch(url, options)
            } catch (error: any) {
                // 如果 token 失效，清除 token 并跳转到登录页
                if (error.statusCode === 401) {
                    authStore.clearToken()
                    const route = useRoute()
                    if (route.path !== '/login') {
                        await navigateTo('/login')
                    }
                }
                throw error
            }
        }
    }
})
