import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, type AuthUser } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'index',
      component: () => import('../views/Index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/cats',
      name: 'cats',
      component: () => import('../views/cats/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cats/new',
      name: 'cats-new',
      component: () => import('../views/cats/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cats/:id',
      name: 'cats-detail',
      component: () => import('../views/cats/form.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/cats/:id/edit',
      name: 'cats-edit',
      component: () => import('../views/cats/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/adoption-apply',
      name: 'adoption-apply',
      component: () => import('../views/adoption-apply/index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/persons',
      name: 'persons',
      component: () => import('../views/persons/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/persons/new',
      name: 'persons-new',
      component: () => import('../views/persons/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/persons/:id',
      name: 'persons-detail',
      component: () => import('../views/persons/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/persons/:id/edit',
      name: 'persons-edit',
      component: () => import('../views/persons/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/units',
      name: 'units',
      component: () => import('../views/units/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/units/new',
      name: 'units-new',
      component: () => import('../views/units/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/units/:id',
      name: 'units-detail',
      component: () => import('../views/units/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/units/:id/edit',
      name: 'units-edit',
      component: () => import('../views/units/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('../views/roles/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/roles/new',
      name: 'roles-new',
      component: () => import('../views/roles/form.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/roles/:id/edit',
      name: 'roles-edit',
      component: () => import('../views/roles/form.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 允许访问登录页面、首页（猫咪列表）、猫咪详情页和领养申请页
  if (
    to.path === '/login' ||
    to.path === '/' ||
    (to.path.startsWith('/cats/') && /^\/cats\/\d+$/.test(to.path)) ||
    to.path === '/adoption-apply'
  ) {
    return next()
  }

  const authStore = useAuthStore()

  // 检查是否登录
  if (!authStore.token) {
    return next('/login')
  }

  // 如果有缓存的用户信息，使用缓存的；否则从 API 获取
  let currentUser = authStore.user
  if (!currentUser) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })
      if (response.ok) {
        const userData = await response.json() as AuthUser | null
        if (userData) {
          currentUser = userData
          authStore.setToken(authStore.token || '', userData)
        } else {
          authStore.clearToken()
          return next('/login')
        }
      } else {
        authStore.clearToken()
        return next('/login')
      }
    } catch (error) {
      authStore.clearToken()
      return next('/login')
    }
  }

  // 管理员拥有所有权限
  if (currentUser?.role_name === 'admin') {
    return next()
  }

  // 检查用户是否有权限访问该页面
  try {
    const pagesResponse = await fetch('/api/pages', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    const rolesResponse = await fetch(`/api/roles/${currentUser?.role_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (pagesResponse.ok && rolesResponse.ok) {
      const pages = await pagesResponse.json()
      const userPages = await rolesResponse.json()

      const hasPermission = userPages.pages?.some((pageId: number) => {
        const page = pages.find((p: any) => p.id === pageId)
        return page && to.path.startsWith(page.path)
      })

      if (!hasPermission) {
        return next('/')
      }
    }
  } catch (error) {
    console.error('权限检查失败:', error)
    // 权限检查失败，允许访问（避免阻塞）
  }

  next()
})

export default router
