import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { $fetch } from '../utils/fetch'

/**
 * useAuth composable - 提供认证相关的功能
 * 现在使用 Pinia store 来管理状态，性能更好
 */
export const useAuth = () => {
  const authStore = useAuthStore()

  // 使用 storeToRefs 来保持响应式，同时解构 store
  const { token, user } = storeToRefs(authStore)

  return {
    // 响应式的 token 和 user（直接返回 ref，已经是响应式的）
    token,
    user,

    // Store actions
    setToken: authStore.setToken.bind(authStore),
    clearToken: authStore.clearToken.bind(authStore),
    getAuthHeader: authStore.getAuthHeader.bind(authStore),

    // 计算属性
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isAdmin: computed(() => authStore.isAdmin),

    // 带认证的 fetch 函数
    fetchWithAuth: async (url: string, options: any = {}) => {
      const router = useRouter()
      try {
        return await $fetch(url, options)
      } catch (error: any) {
        // 如果 token 失效，清除 token 并跳转到登录页
        if (error.statusCode === 401) {
          authStore.clearToken()
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
        }
        throw error
      }
    },
  }
}


