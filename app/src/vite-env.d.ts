/// <reference types="vite/client" />
/// <reference types="../../auto-imports.d.ts" />

import { $fetch } from './utils/fetch'
import { navigateTo } from './utils/navigation'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $fetch: typeof $fetch
    navigateTo: typeof navigateTo
  }
}

// 全局类型声明，让页面可以直接使用 $fetch 和 navigateTo
// 注意：useRoute 和 useRouter 已经在 auto-imports.d.ts 中自动导入了
declare global {
  const $fetch: typeof import('./utils/fetch').$fetch
  const navigateTo: typeof import('./utils/navigation').navigateTo
  const useAuth: typeof import('./composables/useAuth').useAuth
  const useAuthStore: typeof import('./stores/auth').useAuthStore
  const definePageMeta: (meta: any) => void
}

export {}

