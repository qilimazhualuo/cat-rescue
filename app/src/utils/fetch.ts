/**
 * 统一的 fetch 工具函数，替代 Nuxt 的 $fetch
 */
export async function $fetch<T = any>(
  url: string,
  options: {
    method?: string
    body?: any
    query?: Record<string, any>
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  const authStore = (await import('../stores/auth')).useAuthStore()

  // 构建 URL
  let fullUrl = url
  if (options.query) {
    const params = new URLSearchParams()
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const queryString = params.toString()
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`
  }

  // 构建请求体
  let body: string | FormData | undefined
  if (options.body) {
    if (options.body instanceof FormData) {
      body = options.body
      delete headers['Content-Type'] // FormData 会自动设置 Content-Type
    } else {
      body = JSON.stringify(options.body)
    }
  }

  // 发送请求
  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body,
  })

  // 处理响应
  const data = await response.json()

  if (!response.ok) {
    const error: any = new Error(data.message || '请求失败')
    error.statusCode = response.status
    error.data = data
    throw error
  }

  return data
}

