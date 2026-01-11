<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div v-if="loading" class="text-center py-8">
            <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="!person" class="bg-white rounded-lg shadow p-8 text-center">
            <p class="text-gray-600">人员不存在</p>
            <NuxtLink to="/persons" class="mt-4 inline-block text-blue-600 hover:text-blue-800">
                返回列表
            </NuxtLink>
        </div>

        <div v-else>
            <div class="flex justify-between items-center mb-6">
                <div class="space-x-2">
                    <NuxtLink
                        :to="`/persons/edit-${person.id}`"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                        编辑
                    </NuxtLink>
                    <NuxtLink
                        to="/persons"
                        class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition">
                        返回列表
                    </NuxtLink>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">姓名</label>
                        <p class="text-lg font-semibold text-gray-900">{{ person.name }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">性别</label>
                        <p class="text-lg text-gray-900">{{ person.gender || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">身份证号</label>
                        <p class="text-lg text-gray-900">{{ person.id_card || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">出生日期</label>
                        <p class="text-lg text-gray-900">{{ person.birth_date || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">联系电话</label>
                        <p class="text-lg text-gray-900">{{ person.phone || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">邮箱</label>
                        <p class="text-lg text-gray-900">{{ person.email || '-' }}</p>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-500 mb-1">地址</label>
                        <p class="text-lg text-gray-900">{{ person.address || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">所属单位</label>
                        <p class="text-lg text-gray-900">{{ person.unit_name || '-' }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">职位</label>
                        <p class="text-lg text-gray-900">{{ person.position || '-' }}</p>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-500 mb-1">备注</label>
                        <p class="text-lg text-gray-900 whitespace-pre-wrap">
                            {{ person.notes || '-' }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
                        <p class="text-lg text-gray-900">{{ formatDate(person.created_at) }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">更新时间</label>
                        <p class="text-lg text-gray-900">{{ formatDate(person.updated_at) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Person {
    id?: number
    name: string
    id_card?: string
    phone?: string
    email?: string
    gender?: string
    birth_date?: string
    address?: string
    unit_id?: number
    unit_name?: string
    position?: string
    notes?: string
    created_at?: string
    updated_at?: string
}

const route = useRoute()
const person = ref<Person | null>(null)
const loading = ref(true)

const loadPerson = async () => {
    loading.value = true
    try {
        const id = route.params.id as string
        person.value = await $fetch(`/api/persons/${id}`)
    } catch (error) {
        console.error('加载人员详情失败:', error)
        person.value = null
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
    loadPerson()
})
</script>
