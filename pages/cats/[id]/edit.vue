<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- 测试：确保页面能渲染 -->
        <div class="mb-4 p-4 bg-red-200 border-2 border-red-500">
            <h2 class="text-xl font-bold">编辑页面已加载！</h2>
            <p>如果看到这个红色框，说明页面组件已经渲染</p>
        </div>

        <h1 class="text-3xl font-bold text-gray-800 mb-6">编辑猫咪信息</h1>

        <!-- 调试信息 -->
        <div class="mb-4 p-2 bg-yellow-100 text-xs">
            <p>路径: {{ route.path }}</p>
            <p>参数: {{ JSON.stringify(route.params) }}</p>
            <p>ID: {{ id }}</p>
            <p>Loading: {{ loading }}</p>
        </div>

        <div v-if="loading" class="text-center py-12">
            <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">加载中...</p>
        </div>

        <form
            v-else
            @submit.prevent="submitForm"
            class="bg-white rounded-lg shadow-md p-6 space-y-6">
            <!-- 基本信息 -->
            <div class="border-b pb-6">
                <h2 class="text-xl font-semibold text-gray-700 mb-4">基本信息</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >宠物类别 *</label
                        >
                        <select
                            v-model="form.category"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">请选择</option>
                            <option value="猫">猫</option>
                            <option value="狗">狗</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >宠物名称 *</label
                        >
                        <input
                            v-model="form.name"
                            type="text"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">性别 *</label>
                        <select
                            v-model="form.gender"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">请选择</option>
                            <option value="公">公</option>
                            <option value="母">母</option>
                            <option value="未知">未知</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >年龄（月） *</label
                        >
                        <input
                            v-model.number="form.age_months"
                            type="number"
                            min="0"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            <!-- 健康信息 -->
            <div class="border-b pb-6">
                <h2 class="text-xl font-semibold text-gray-700 mb-4">健康信息</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="flex items-center space-x-2">
                            <input
                                v-model="form.is_vaccinated"
                                type="checkbox"
                                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                            <span class="text-sm font-medium text-gray-700">是否免疫</span>
                        </label>
                        <div v-if="form.is_vaccinated" class="mt-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >免疫证明照片</label
                            >
                            <input
                                ref="vaccinationProofInput"
                                type="file"
                                accept="image/*"
                                @change="handleVaccinationProofUpload"
                                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div v-if="form.vaccination_proof" class="mt-2">
                                <img
                                    :src="getImageUrl(form.vaccination_proof)"
                                    alt="免疫证明"
                                    class="max-w-xs h-32 object-cover rounded border" />
                                <button
                                    type="button"
                                    @click="removeVaccinationProof"
                                    class="mt-1 text-sm text-red-600 hover:text-red-800">
                                    删除图片
                                </button>
                            </div>
                            <p v-if="uploadingVaccinationProof" class="text-sm text-gray-500 mt-1">
                                上传中...
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="flex items-center space-x-2">
                            <input
                                v-model="form.is_dewormed"
                                type="checkbox"
                                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                            <span class="text-sm font-medium text-gray-700">是否驱虫</span>
                        </label>
                    </div>

                    <div>
                        <label class="flex items-center space-x-2">
                            <input
                                v-model="form.is_neutered"
                                type="checkbox"
                                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                            <span class="text-sm font-medium text-gray-700">是否绝育</span>
                        </label>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">宠物照片</label>
                        <input
                            ref="photoInput"
                            type="file"
                            accept="image/*"
                            @change="handlePhotoUpload"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <div v-if="form.photo" class="mt-2">
                            <img
                                :src="getImageUrl(form.photo)"
                                alt="宠物照片"
                                class="max-w-xs h-32 object-cover rounded border" />
                            <button
                                type="button"
                                @click="removePhoto"
                                class="mt-1 text-sm text-red-600 hover:text-red-800">
                                删除图片
                            </button>
                        </div>
                        <p v-if="uploadingPhoto" class="text-sm text-gray-500 mt-1">上传中...</p>
                    </div>
                </div>
            </div>

            <!-- 救助信息 -->
            <div class="border-b pb-6">
                <h2 class="text-xl font-semibold text-gray-700 mb-4">救助信息</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >救助人姓名 *</label
                        >
                        <input
                            v-model="form.rescuer_name"
                            type="text"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
                        <input
                            v-model="form.phone"
                            type="tel"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >救助日期 *</label
                        >
                        <input
                            v-model="form.rescue_date"
                            type="date"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"
                            >救助地点 *</label
                        >
                        <input
                            v-model="form.rescue_location"
                            type="text"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        救助过程 *（20-200字）
                        <span class="text-gray-500">({{ form.rescue_process.length }} 字)</span>
                    </label>
                    <textarea
                        v-model="form.rescue_process"
                        required
                        rows="4"
                        minlength="20"
                        maxlength="200"
                        placeholder="请详细描述救助过程..."
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        :class="{
                            'border-red-500':
                                form.rescue_process.length > 0 &&
                                (form.rescue_process.length < 20 ||
                                    form.rescue_process.length > 200),
                        }"></textarea>
                    <p
                        v-if="
                            form.rescue_process.length > 0 &&
                            (form.rescue_process.length < 20 || form.rescue_process.length > 200)
                        "
                        class="text-red-500 text-sm mt-1">
                        字数必须在20-200字之间
                    </p>
                </div>
            </div>

            <!-- 安置信息 -->
            <div>
                <h2 class="text-xl font-semibold text-gray-700 mb-4">安置信息</h2>
                <div class="space-y-4">
                    <div>
                        <label class="flex items-center space-x-2">
                            <input
                                v-model="form.is_placed"
                                type="checkbox"
                                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                            <span class="text-sm font-medium text-gray-700">宠物是否已安置</span>
                        </label>
                    </div>

                    <div v-if="form.is_placed">
                        <label class="block text-sm font-medium text-gray-700 mb-1">领养地点</label>
                        <input
                            v-model="form.adoption_location"
                            type="text"
                            placeholder="领养地点（可选）"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">宠物现状</label>
                        <textarea
                            v-model="form.current_status"
                            rows="3"
                            placeholder="描述宠物当前的状态、性格、生活习性、领养的特殊要求等（可选）"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                </div>
            </div>

            <!-- 提交按钮 -->
            <div class="flex gap-4 pt-4">
                <button
                    type="submit"
                    :disabled="submitting || !isFormValid"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition">
                    {{ submitting ? '保存中...' : '保存' }}
                </button>
                <NuxtLink
                    :to="`/cats/${id}`"
                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center">
                    取消
                </NuxtLink>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
// 使用 definePageMeta 确保页面在路由参数变化时重新渲染
definePageMeta({
    key: route => {
        // 从路径中提取 ID
        const pathParts = route.path.split('/').filter(p => p)
        const catsIndex = pathParts.indexOf('cats')
        const id =
            catsIndex >= 0 && pathParts[catsIndex + 1] ? pathParts[catsIndex + 1] : route.params.id
        return `cat-edit-${id}`
    },
})

// 立即打印，确保脚本执行（在服务器端和客户端都执行）
console.log('=== 编辑页面脚本开始执行 ===')
console.log('执行环境:', typeof window !== 'undefined' ? '客户端' : '服务器端')

const route = useRoute()
const router = useRouter()

console.log('route 初始化完成，path:', route.path, 'params:', route.params)

// 从路径中提取 ID（嵌套路由需要手动提取）
const id = computed(() => {
    // 从路径中提取 ID：/cats/1/edit -> 1
    const pathParts = route.path.split('/').filter(p => p)
    const catsIndex = pathParts.indexOf('cats')

    console.log('提取 ID，pathParts:', pathParts, 'catsIndex:', catsIndex)

    if (catsIndex >= 0 && pathParts[catsIndex + 1]) {
        const extractedId = pathParts[catsIndex + 1]
        // 确保 ID 不是 'edit' 或其他无效值
        if (extractedId !== 'edit' && extractedId !== 'new') {
            console.log('从路径提取到 ID:', extractedId)
            return extractedId
        }
    }

    // 如果路径解析失败，尝试从 route.params.id 获取
    const paramId = String(route.params.id || '')
    console.log('从 route.params.id 获取:', paramId)
    return paramId
})

const loading = ref(true)
const submitting = ref(false)
const uploadingPhoto = ref(false)
const uploadingVaccinationProof = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)
const vaccinationProofInput = ref<HTMLInputElement | null>(null)

const form = ref({
    category: '',
    name: '',
    gender: '',
    age_months: 0,
    is_vaccinated: false,
    vaccination_proof: '',
    is_dewormed: false,
    is_neutered: false,
    photo: '',
    rescuer_name: '',
    phone: '',
    rescue_date: '',
    rescue_location: '',
    rescue_process: '',
    is_placed: false,
    adoption_location: '',
    current_status: '',
})

const isFormValid = computed(() => {
    return (
        form.value.category &&
        form.value.name &&
        form.value.gender &&
        form.value.age_months >= 0 &&
        form.value.rescuer_name &&
        form.value.phone &&
        form.value.rescue_date &&
        form.value.rescue_location &&
        form.value.rescue_process.length >= 20 &&
        form.value.rescue_process.length <= 200
    )
})

// 参考详情页面的 loadCat 函数
const loadCat = async () => {
    console.log(
        'loadCat 开始执行，id.value:',
        id.value,
        'route.path:',
        route.path,
        'route.params:',
        route.params,
    )

    if (!id.value) {
        console.error('ID 为空，无法加载')
        loading.value = false
        alert('无法获取猫咪ID')
        router.push('/')
        return
    }

    loading.value = true
    console.log('开始加载数据，API URL:', `/api/cats/${id.value}`)

    try {
        const cat = await $fetch(`/api/cats/${id.value}`)
        console.log('数据加载成功:', cat)
        form.value = {
            category: cat.category,
            name: cat.name,
            gender: cat.gender,
            age_months: cat.age_months,
            is_vaccinated: cat.is_vaccinated === 1,
            vaccination_proof: cat.vaccination_proof || '',
            is_dewormed: cat.is_dewormed === 1,
            is_neutered: cat.is_neutered === 1,
            photo: cat.photo || '',
            rescuer_name: cat.rescuer_name,
            phone: cat.phone,
            rescue_date: cat.rescue_date,
            rescue_location: cat.rescue_location,
            rescue_process: cat.rescue_process,
            is_placed: cat.is_placed === 1,
            adoption_location: cat.adoption_location || '',
            current_status: cat.current_status || '',
        }
        console.log('表单数据已更新')
    } catch (error: any) {
        console.error('加载失败:', error)
        console.error('错误详情:', {
            statusCode: error.statusCode,
            message: error.message,
            data: error.data,
        })
        if (error.statusCode === 404) {
            alert('未找到该猫咪信息')
            router.push('/')
        } else {
            alert('加载失败: ' + (error.message || '未知错误'))
        }
    } finally {
        console.log('finally 执行，设置 loading 为 false')
        loading.value = false
    }
}

const handlePhotoUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    uploadingPhoto.value = true
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await $fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })

        form.value.photo = response.url
    } catch (error: any) {
        alert(error.data?.message || '图片上传失败')
        if (photoInput.value) {
            photoInput.value.value = ''
        }
    } finally {
        uploadingPhoto.value = false
    }
}

const handleVaccinationProofUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    uploadingVaccinationProof.value = true
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await $fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })

        form.value.vaccination_proof = response.url
    } catch (error: any) {
        alert(error.data?.message || '图片上传失败')
        if (vaccinationProofInput.value) {
            vaccinationProofInput.value.value = ''
        }
    } finally {
        uploadingVaccinationProof.value = false
    }
}

const removePhoto = () => {
    form.value.photo = ''
    if (photoInput.value) {
        photoInput.value.value = ''
    }
}

const removeVaccinationProof = () => {
    form.value.vaccination_proof = ''
    if (vaccinationProofInput.value) {
        vaccinationProofInput.value.value = ''
    }
}

const submitForm = async () => {
    if (!isFormValid.value) {
        alert('请填写所有必填字段，并确保救助过程描述在20-200字之间')
        return
    }

    submitting.value = true
    try {
        await $fetch(`/api/cats/${id.value}`, {
            method: 'PUT',
            body: form.value,
        })
        alert('保存成功！')
        router.push(`/cats/${id.value}`)
    } catch (error: any) {
        alert(error.data?.message || '保存失败，请重试')
    } finally {
        submitting.value = false
    }
}

const getImageUrl = useImageUrl

// 在 onMounted 中加载数据
onMounted(() => {
    console.log('onMounted 执行')
    console.log('route.path:', route.path)
    console.log('route.params:', route.params)
    console.log('id.value:', id.value)

    if (id.value) {
        console.log('ID 存在，调用 loadCat')
        loadCat()
    } else {
        console.error('ID 不存在，设置 loading 为 false')
        loading.value = false
        alert('无法获取猫咪ID，请检查URL是否正确')
    }
})
</script>
