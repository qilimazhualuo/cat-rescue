<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div v-if="loading" class="text-center py-12">
            <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <div v-else-if="cat" class="bg-white rounded-lg shadow-md overflow-hidden">
            <!-- 返回按钮 -->
            <div class="p-4 border-b">
                <button
                    @click="goBack"
                    class="text-blue-600 hover:text-blue-800 inline-flex items-center">
                    ← 返回
                </button>
            </div>

            <!-- 猫咪信息预览 -->
            <div class="p-6 border-b bg-gray-50">
                <div class="flex gap-4">
                    <div v-if="cat.photo" class="w-32 h-32 flex-shrink-0">
                        <img
                            :src="getImageUrl(cat.photo)"
                            :alt="cat.name"
                            class="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div class="flex-1">
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ cat.name }}</h1>
                        <p class="text-gray-600 mb-2">
                            {{ cat.category }} · {{ cat.gender }} · {{ cat.age_months }} 个月
                        </p>
                        <div class="flex items-center gap-4 text-sm text-gray-600">
                            <span>救助人：{{ cat.rescuer_name }}</span>
                            <span>救助日期：{{ cat.rescue_date }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 领养申请表单 -->
            <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-700 mb-6">填写领养申请</h2>

                <form @submit.prevent="submitApplication" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >申请人姓名 *</label
                            >
                            <input
                                v-model="applicationForm.applicant_name"
                                type="text"
                                required
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="请输入您的姓名" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >联系电话 *</label
                            >
                            <input
                                v-model="applicationForm.applicant_phone"
                                type="tel"
                                required
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="请输入联系电话" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >身份证号</label
                            >
                            <input
                                v-model="applicationForm.applicant_id_card"
                                type="text"
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="请输入身份证号" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                            <input
                                v-model="applicationForm.applicant_email"
                                type="email"
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="请输入邮箱地址" />
                        </div>

                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >家庭住址</label
                            >
                            <input
                                v-model="applicationForm.applicant_address"
                                type="text"
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="请输入家庭住址" />
                        </div>

                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >位置坐标</label
                            >
                            <MapPicker v-model="applicationForm.applicant_location" />
                        </div>

                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >申请理由 *</label
                            >
                            <textarea
                                v-model="applicationForm.application_reason"
                                rows="4"
                                required
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="请详细说明您想要领养这只猫咪的理由，包括您的居住环境、养宠经验等"></textarea>
                        </div>
                    </div>

                    <div class="flex gap-4 pt-4 border-t">
                        <button
                            type="submit"
                            :disabled="submitting"
                            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition">
                            {{ submitting ? '提交中...' : '提交申请' }}
                        </button>
                        <button
                            type="button"
                            @click="goBack"
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition">
                            取消
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-else class="text-center py-12 bg-white rounded-lg shadow">
            <p class="text-gray-500 text-lg">未找到该猫咪信息</p>
            <NuxtLink to="/" class="text-blue-600 hover:underline mt-4 inline-block"
                >返回首页</NuxtLink
            >
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id || ''))

const loading = ref(true)
const submitting = ref(false)
const cat = ref<any>(null)

const applicationForm = ref({
    applicant_name: '',
    applicant_phone: '',
    applicant_id_card: '',
    applicant_email: '',
    applicant_address: '',
    applicant_location: '',
    application_reason: '',
})

const goBack = () => {
    if (window.history.length > 1) {
        router.back()
    } else {
        router.push('/')
    }
}

const loadCat = async () => {
    loading.value = true
    try {
        cat.value = await $fetch(`/api/cats/${id.value}`)
    } catch (error: any) {
        if (error.statusCode === 404) {
            cat.value = null
        } else {
            alert('加载失败')
        }
    } finally {
        loading.value = false
    }
}

const submitApplication = async () => {
    if (!cat.value?.id) return

    submitting.value = true
    try {
        await $fetch('/api/adoption-applications', {
            method: 'POST',
            body: {
                cat_id: cat.value.id,
                ...applicationForm.value,
            },
        })
        alert('申请提交成功！我们会尽快与您联系。')
        goBack()
    } catch (error: any) {
        alert(error.data?.message || '提交失败，请重试')
    } finally {
        submitting.value = false
    }
}

const getImageUrl = useImageUrl

onMounted(() => {
    loadCat()
})
</script>
