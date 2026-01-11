import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import './assets/css/main.css'

// 全局导入工具函数，让页面可以直接使用
import { $fetch } from './utils/fetch'
import { navigateTo } from './utils/navigation'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { useAuthStore } from './stores/auth'

// 全局声明，让页面可以直接使用（类似 Nuxt 的自动导入）
;(window as any).$fetch = $fetch
;(window as any).navigateTo = navigateTo
;(window as any).useRoute = useRoute
;(window as any).useRouter = useRouter
;(window as any).useAuth = useAuth
;(window as any).useAuthStore = useAuthStore
;(window as any).definePageMeta = () => {} // 空函数，兼容 Nuxt 的 definePageMeta

const app = createApp(App)

// Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Router
app.use(router)

app.mount('#app')
