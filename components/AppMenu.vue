<template>
    <nav class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div class="container mx-auto px-2 sm:px-4">
            <div class="flex items-center justify-between h-14 sm:h-16">
                <!-- Logo -->
                <NuxtLink
                    to="/"
                    class="text-base sm:text-lg md:text-xl font-bold text-gray-800 hover:text-blue-600 transition flex-shrink-0">
                    猫咪领养
                </NuxtLink>

                <!-- 菜单下拉按钮 -->
                <div class="flex items-center gap-2 sm:gap-4">
                    <template v-if="user">
                        <span class="hidden sm:inline text-xs sm:text-sm text-gray-600"
                            >欢迎，{{ user.name }}</span
                        >
                        <button
                            @click="handleLogout"
                            class="text-xs sm:text-sm text-red-600 hover:text-red-800 transition px-2 py-1">
                            退出
                        </button>
                    </template>
                    <NuxtLink
                        v-else
                        to="/login"
                        class="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 transition">
                        登录
                    </NuxtLink>

                    <!-- 下拉菜单按钮（仅登录用户可见） -->
                    <div v-if="user" class="relative">
                        <button
                            @click="menuDropdownOpen = !menuDropdownOpen"
                            class="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition"
                            :class="{ 'text-blue-600 bg-blue-50': menuDropdownOpen }">
                            <span>菜单</span>
                            <svg
                                class="w-4 h-4 transition-transform"
                                :class="{ 'rotate-180': menuDropdownOpen }"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <!-- 下拉菜单 -->
                        <div
                            v-if="menuDropdownOpen"
                            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                            @click.stop>
                            <NuxtLink
                                to="/"
                                @click="menuDropdownOpen = false"
                                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
                                :class="{ 'bg-blue-50 text-blue-600': route.path === '/' }">
                                首页
                            </NuxtLink>
                            <template v-if="menus.length > 0">
                                <div class="border-t border-gray-200 my-1"></div>
                                <NuxtLink
                                    v-for="menu in menus"
                                    :key="menu.id"
                                    :to="menu.path"
                                    @click="menuDropdownOpen = false"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
                                    :class="{ 'bg-blue-50 text-blue-600': isActive(menu.path) }">
                                    {{ menu.name }}
                                </NuxtLink>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
const { user, clearToken } = useAuth()
const menus = ref<any[]>([])
const menuDropdownOpen = ref(false)

const route = useRoute()

const loadMenus = async () => {
    try {
        menus.value = await $fetch('/api/menu')
    } catch (error) {
        console.error('加载菜单失败:', error)
        menus.value = []
    }
}

const loadUserData = async () => {
    try {
        // 如果 store 中有 token 但没有用户信息，从 API 获取
        const authStore = useAuthStore()
        if (authStore.token && !authStore.user) {
            const userData = await $fetch('/api/auth/me')
            if (userData) {
                authStore.setToken(authStore.token, userData)
            }
        }
        await loadMenus()
    } catch (error) {
        // 如果获取失败，可能是 token 无效，清除 token
        clearToken()
        menus.value = []
    }
}

const isActive = (path: string) => {
    return route.path.startsWith(path)
}

const handleLogout = async () => {
    try {
        await $fetch('/api/auth/logout', { method: 'POST' })
        clearToken()
        await navigateTo('/')
    } catch (error) {
        console.error('退出失败:', error)
        // 即使 API 调用失败，也清除本地 token
        clearToken()
        await navigateTo('/')
    }
}

// 监听用户信息变化，当用户信息加载后自动加载菜单
watch(
    () => user.value,
    async (newUser, oldUser) => {
        // 当用户从无到有时，加载菜单
        if (newUser && !oldUser) {
            await loadMenus()
        }
        // 当用户从有到无时，清空菜单
        if (!newUser && oldUser) {
            menus.value = []
        }
    },
    { immediate: true },
)

onMounted(() => {
    // Pinia 持久化插件会自动从 localStorage 加载 token
    const authStore = useAuthStore()

    // 如果 store 中已经有用户信息，直接加载菜单
    if (authStore.user) {
        loadMenus()
    } else if (authStore.token) {
        // 如果有 token 但没有用户信息，先加载用户信息（loadUserData 会调用 loadMenus）
        loadUserData()
    }
})

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
        menuDropdownOpen.value = false
    }
}

// 监听路由变化，更新菜单状态
watch(
    () => route.path,
    () => {
        // 菜单高亮会自动更新
        menuDropdownOpen.value = false // 路由变化时关闭下拉菜单
    },
)

// 监听下拉菜单状态，添加/移除点击外部关闭事件
watch(menuDropdownOpen, isOpen => {
    if (isOpen) {
        nextTick(() => {
            document.addEventListener('click', handleClickOutside)
        })
    } else {
        document.removeEventListener('click', handleClickOutside)
    }
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>
