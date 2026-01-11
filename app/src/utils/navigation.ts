import { useRouter } from 'vue-router'

/**
 * navigateTo - 替代 Nuxt 的 navigateTo
 */
export async function navigateTo(to: string) {
  const router = useRouter()
  return router.push(to)
}

