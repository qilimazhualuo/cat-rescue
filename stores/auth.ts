import { defineStore } from 'pinia';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  role_id: number | null;
  role_name: string | null;
  unit_id: number | null;
  unit_name: string | null;
}

/**
 * Pinia Auth Store - 使用组合式 API (Setup Store) 写法
 * 这是 Pinia 推荐的写法，更符合 Vue 3 的组合式 API 风格
 */
export const useAuthStore = defineStore('auth', () => {
  // State - 使用 ref
  const token = ref<string | null>(null);
  const user = ref<AuthUser | null>(null);

  // Getters - 使用 computed
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role_name === 'admin');

  // Actions - 普通函数
  /**
   * 设置 token 和用户信息
   * Pinia 持久化插件会自动保存到 localStorage
   * @param newToken JWT token
   * @param userData 用户信息（可选）
   */
  function setToken(newToken: string, userData?: AuthUser) {
    token.value = newToken;
    if (userData) {
      user.value = userData;
    }
  }

  /**
   * 清除 token 和用户信息
   * Pinia 持久化插件会自动从 localStorage 清除
   */
  function clearToken() {
    token.value = null;
    user.value = null;
  }

  /**
   * 获取 Authorization header
   * @returns 包含 Authorization header 的对象，如果没有 token 则返回空对象
   */
  function getAuthHeader() {
    if (token.value) {
      return {
        Authorization: `Bearer ${token.value}`
      };
    }
    return {};
  }

  // 返回 state、getters 和 actions
  return {
    // State
    token,
    user,
    // Getters
    isAuthenticated,
    isAdmin,
    // Actions
    setToken,
    clearToken,
    getAuthHeader,
  };
}, {
  persist: true, // 启用持久化，默认持久化所有 state
});

