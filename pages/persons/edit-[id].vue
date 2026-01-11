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
            <form @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                        <input
                            v-model="form.name"
                            type="text"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入姓名" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
                        <select
                            v-model="form.gender"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">请选择</option>
                            <option value="男">男</option>
                            <option value="女">女</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
                        <input
                            v-model="form.id_card"
                            type="text"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入身份证号"
                            maxlength="18" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                        <input
                            v-model="form.phone"
                            type="tel"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入联系电话" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                        <input
                            v-model="form.username"
                            type="text"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入用户名" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                        <input
                            v-model="form.password"
                            type="password"
                            required
                            minlength="6"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入密码（至少6位）" />
                        <p class="mt-1 text-xs text-gray-500">密码长度至少6位</p>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">地址</label>
                        <input
                            v-model="form.address"
                            type="text"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入地址" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >所属单位 *</label
                        >
                        <select
                            v-model="form.unit_id"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option :value="undefined">请选择单位</option>
                            <option v-for="unit in units" :key="unit.id" :value="unit.id">
                                {{ unit.name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
                        <select
                            v-model="form.role_id"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option :value="undefined">请选择角色</option>
                            <option v-for="role in roles" :key="role.id" :value="role.id">
                                {{ role.name
                                }}{{ role.description ? ` - ${role.description}` : '' }}
                            </option>
                        </select>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
                        <textarea
                            v-model="form.notes"
                            rows="4"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入备注信息"></textarea>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 pt-4 border-t">
                    <NuxtLink
                        :to="`/persons/${person.id}`"
                        class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        取消
                    </NuxtLink>
                    <button
                        type="submit"
                        :disabled="submitting"
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ submitting ? '提交中...' : '提交' }}
                    </button>
                </div>
            </form>
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
    username?: string
    created_at?: string
    updated_at?: string
}

interface Unit {
    id?: number
    name: string
}

interface Role {
    id?: number
    name: string
    description?: string
}

const route = useRoute()
const person = ref<Person | null>(null)
const loading = ref(true)
const submitting = ref(false)

// 使用 useFetch 实现服务器端渲染 - 单位
const { data: unitsResponse } = await useFetch<{ data: Unit[] }>('/api/units', {
    query: {
        pageSize: 1000,
        status: 'active',
    },
    default: () => ({ data: [] }),
})
const units = computed(() => unitsResponse.value?.data || [])

// 使用 useFetch 实现服务器端渲染 - 角色
const { data: roles } = await useFetch<Role[]>('/api/roles', {
    default: () => [],
})

const form = reactive({
    name: '',
    id_card: '',
    phone: '',
    gender: '',
    address: '',
    unit_id: undefined as number | undefined,
    role_id: undefined as number | undefined,
    notes: '',
    username: '',
    password: '',
})

const loadPerson = async () => {
    loading.value = true
    try {
        const id = route.params.id as string
        person.value = await $fetch(`/api/persons/${id}`)
        if (person.value) {
            form.name = person.value.name
            form.id_card = person.value.id_card || ''
            form.phone = person.value.phone || ''
            form.gender = person.value.gender || ''
            form.address = person.value.address || ''
            form.unit_id = person.value.unit_id
            form.notes = person.value.notes || ''
            form.role_id = person.value.role_id
            form.username = person.value.username || ''
        }
    } catch (error) {
        console.error('加载人员详情失败:', error)
        person.value = null
    } finally {
        loading.value = false
    }
}

const submitForm = async () => {
    // 验证必填字段
    if (!form.unit_id) {
        alert('请选择所属单位')
        return
    }
    if (!form.role_id) {
        alert('请选择角色')
        return
    }
    if (!form.username || form.username.trim() === '') {
        alert('请输入用户名')
        return
    }
    if (!form.password || form.password.trim() === '') {
        alert('请输入密码')
        return
    }
    if (form.password.length < 6) {
        alert('密码长度至少6位')
        return
    }

    submitting.value = true
    try {
        const id = route.params.id as string
        await $fetch(`/api/persons/${id}`, {
            method: 'PUT',
            body: form,
        })
        alert('更新成功')
        navigateTo(`/persons/${id}`)
    } catch (error: any) {
        console.error('更新失败:', error)
        alert(error.data?.message || '更新失败')
    } finally {
        submitting.value = false
    }
}

onMounted(() => {
    loadPerson()
})
</script>
