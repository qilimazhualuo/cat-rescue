<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <form @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">单位名称 *</label>
                    <input
                        v-model="form.name"
                        type="text"
                        required
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入单位名称" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">单位编码</label>
                    <input
                        v-model="form.code"
                        type="text"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入单位编码" />
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">地址</label>
                    <input
                        v-model="form.address"
                        type="text"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入单位地址" />
                </div>

                <div class="md:col-span-2">
                    <MapPicker v-model="form.location" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                    <input
                        v-model="form.contact_person"
                        type="text"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入联系人姓名" />
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input
                        v-model="form.email"
                        type="email"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入邮箱地址" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select
                        v-model="form.status"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="active">启用</option>
                        <option value="inactive">停用</option>
                    </select>
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                        v-model="form.description"
                        rows="4"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入单位描述信息"></textarea>
                </div>
            </div>

            <div class="flex justify-end space-x-4 pt-4 border-t">
                <NuxtLink
                    to="/units"
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
</template>

<script setup lang="ts">
const form = reactive({
    name: '',
    code: '',
    address: '',
    location: '',
    contact_person: '',
    phone: '',
    email: '',
    description: '',
    status: 'active',
})

const submitting = ref(false)

const submitForm = async () => {
    submitting.value = true
    try {
        await $fetch('/api/units', {
            method: 'POST',
            body: form,
        })
        alert('创建成功')
        navigateTo('/units')
    } catch (error: any) {
        console.error('创建失败:', error)
        alert(error.data?.message || '创建失败')
    } finally {
        submitting.value = false
    }
}
</script>
