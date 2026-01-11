<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div v-if="loading" class="text-center py-8">
            <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="!unit" class="bg-white rounded-lg shadow p-8 text-center">
            <p class="text-gray-600">单位不存在</p>
            <NuxtLink to="/units" class="mt-4 inline-block text-blue-600 hover:text-blue-800">
                返回列表
            </NuxtLink>
        </div>

        <div v-else>
            <div class="flex justify-between items-center mb-6">
                <div class="space-x-2">
                    <NuxtLink
                        :to="`/units/edit-${unit.id}`"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                        编辑
                    </NuxtLink>
                    <NuxtLink
                        to="/units"
                        class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition">
                        返回列表
                    </NuxtLink>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">单位名称</label>
                        <p class="text-lg font-semibold text-gray-900">{{ unit.name }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">单位编码</label>
                        <p class="text-lg text-gray-900">{{ unit.code || '-' }}</p>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-500 mb-1">地址</label>
                        <p class="text-lg text-gray-900">{{ unit.address || '-' }}</p>
                    </div>

                    <div class="md:col-span-2" v-if="unit.location">
                        <label class="block text-sm font-medium text-gray-500 mb-1">位置坐标</label>
                        <p class="text-lg text-gray-900">{{ unit.location }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">联系人</label>
                        <p class="text-lg text-gray-900">{{ unit.contact_person || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">联系电话</label>
                        <p class="text-lg text-gray-900">{{ unit.phone || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">邮箱</label>
                        <p class="text-lg text-gray-900">{{ unit.email || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">状态</label>
                        <span
                            :class="
                                unit.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            "
                            class="px-3 py-1 inline-flex text-sm font-semibold rounded-full">
                            {{ unit.status === 'active' ? '启用' : '停用' }}
                        </span>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-500 mb-1">描述</label>
                        <p class="text-lg text-gray-900 whitespace-pre-wrap">
                            {{ unit.description || '-' }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
                        <p class="text-lg text-gray-900">{{ formatDate(unit.created_at) }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">更新时间</label>
                        <p class="text-lg text-gray-900">{{ formatDate(unit.updated_at) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Unit {
    id?: number
    name: string
    code?: string
    address?: string
    location?: string
    contact_person?: string
    phone?: string
    email?: string
    description?: string
    status?: string
    created_at?: string
    updated_at?: string
}

const route = useRoute()
const unit = ref<Unit | null>(null)
const loading = ref(true)

const loadUnit = async () => {
    loading.value = true
    try {
        const id = route.params.id as string
        unit.value = await $fetch(`/api/units/${id}`)
    } catch (error) {
        console.error('加载单位详情失败:', error)
        unit.value = null
    } finally {
        loading.value = false
    }
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
}

onMounted(() => {
    loadUnit()
})
</script>
