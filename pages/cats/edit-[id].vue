<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">编辑猫咪信息</h1>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <form v-else @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <!-- 基本信息 -->
      <div class="border-b pb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">基本信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">宠物类别 *</label>
            <select
              v-model="form.category"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="猫">猫</option>
              <option value="狗">狗</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">宠物名称 *</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">性别 *</label>
            <select
              v-model="form.gender"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="公">公</option>
              <option value="母">母</option>
              <option value="未知">未知</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">年龄（月） *</label>
            <input
              v-model.number="form.age_months"
              type="number"
              min="0"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">是否免疫</span>
            </label>
            <div v-if="form.is_vaccinated" class="mt-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">免疫证明照片</label>
              <input
                ref="vaccinationProofInput"
                type="file"
                accept="image/*"
                @change="handleVaccinationProofSelect"
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div v-if="form.vaccination_proof" class="mt-2">
                <img :src="getImageUrl(form.vaccination_proof)" alt="免疫证明" class="max-w-xs h-32 object-cover rounded border" />
                <button
                  type="button"
                  @click="removeVaccinationProof"
                  class="mt-1 text-sm text-red-600 hover:text-red-800"
                >
                  删除图片
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="flex items-center space-x-2">
              <input
                v-model="form.is_dewormed"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">是否驱虫</span>
            </label>
          </div>

          <div>
            <label class="flex items-center space-x-2">
              <input
                v-model="form.is_neutered"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">是否绝育</span>
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">宠物照片</label>
              <input
                ref="photoInput"
                type="file"
                accept="image/*"
                @change="handlePhotoSelect"
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            <div v-if="form.photo" class="mt-2">
              <img :src="getImageUrl(form.photo)" alt="宠物照片" class="max-w-xs h-32 object-cover rounded border" />
              <button
                type="button"
                @click="removePhoto"
                class="mt-1 text-sm text-red-600 hover:text-red-800"
              >
                删除图片
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 救助信息 -->
      <div class="border-b pb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">救助信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">救助人姓名 *</label>
            <input
              v-model="form.rescuer_name"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
            <input
              v-model="form.phone"
              type="tel"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">救助日期 *</label>
            <input
              v-model="form.rescue_date"
              type="date"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">救助地点 *</label>
            <input
              v-model="form.rescue_location"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            :class="{ 'border-red-500': form.rescue_process.length > 0 && (form.rescue_process.length < 20 || form.rescue_process.length > 200) }"
          ></textarea>
          <p
            v-if="form.rescue_process.length > 0 && (form.rescue_process.length < 20 || form.rescue_process.length > 200)"
            class="text-red-500 text-sm mt-1"
          >
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
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">宠物是否已安置</span>
            </label>
          </div>

          <div v-if="form.is_placed">
            <label class="block text-sm font-medium text-gray-700 mb-1">领养地点</label>
            <input
              v-model="form.adoption_location"
              type="text"
              placeholder="领养地点（可选）"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">宠物现状</label>
            <textarea
              v-model="form.current_status"
              rows="3"
              placeholder="描述宠物当前的状态、性格、生活习性、领养的特殊要求等（可选）"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 领养信息 -->
      <div class="border-t pt-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">领养信息</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">领养状态 *</label>
            <select
              v-model="form.adoption_status"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="未领养">未领养</option>
              <option value="审核中">审核中</option>
              <option value="已领养">已领养</option>
            </select>
          </div>

          <div v-if="form.adoption_status && form.adoption_status !== '未领养'">
            <h3 class="text-lg font-semibold text-gray-700 mb-3">领养人信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">领养人姓名 *</label>
                <input
                  v-model="form.adopter_name"
                  type="text"
                  required
                  class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">领养人电话 *</label>
                <input
                  v-model="form.adopter_phone"
                  type="tel"
                  required
                  class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">家庭住址 *</label>
                <input
                  v-model="form.adopter_address"
                  type="text"
                  required
                  class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="md:col-span-2">
                <MapPicker v-model="form.adopter_location" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="flex gap-4 pt-4">
        <button
          type="submit"
          :disabled="submitting || !isFormValid"
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          {{ submitting ? '保存中...' : '保存' }}
        </button>
        <NuxtLink
          :to="`/cats/${id}`"
          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
        >
          取消
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  key: (route) => `cat-edit-${route.params.id}`
});

const route = useRoute();
const router = useRouter();

// 从路由参数获取 ID
const id = computed(() => {
  return String(route.params.id || '');
});

const loading = ref(true);
const submitting = ref(false);
const photoInput = ref<HTMLInputElement | null>(null);
const vaccinationProofInput = ref<HTMLInputElement | null>(null);
// 保存选中的文件，不立即上传
const selectedPhotoFile = ref<File | null>(null);
const selectedVaccinationProofFile = ref<File | null>(null);

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
  // 领养信息
  adoption_status: '未领养',
  adopter_name: '',
  adopter_phone: '',
  adopter_address: '',
  adopter_location: ''
});

const isFormValid = computed(() => {
  const basicValid = (
    form.value.category &&
    form.value.name &&
    form.value.gender &&
    form.value.age_months >= 0 &&
    form.value.rescuer_name &&
    form.value.phone &&
    form.value.rescue_date &&
    form.value.rescue_location &&
    form.value.rescue_process.length >= 20 &&
    form.value.rescue_process.length <= 200 &&
    form.value.adoption_status
  );
  
  // 如果领养状态不是"未领养"，需要验证领养人信息
  if (form.value.adoption_status && form.value.adoption_status !== '未领养') {
    return basicValid && 
           form.value.adopter_name && 
           form.value.adopter_phone && 
           form.value.adopter_address;
  }
  
  return basicValid;
});

const loadCat = async () => {
  if (!id.value) {
    loading.value = false;
    alert('无法获取猫咪ID');
    router.push('/');
    return;
  }

  loading.value = true;
  try {
    const cat = await $fetch(`/api/cats/${id.value}`);
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
      // 领养信息
      adoption_status: cat.adoption_status || '未领养',
      adopter_name: cat.adopter_name || '',
      adopter_phone: cat.adopter_phone || '',
      adopter_address: cat.adopter_address || '',
      adopter_location: cat.adopter_location || ''
    };
  } catch (error: any) {
    if (error.statusCode === 404) {
      alert('未找到该猫咪信息');
      router.push('/');
    } else {
      alert('加载失败: ' + (error.message || '未知错误'));
    }
  } finally {
    loading.value = false;
  }
};

// 选择照片，不立即上传，只保存文件引用
const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedPhotoFile.value = file;
    // 创建预览 URL
    form.value.photo = URL.createObjectURL(file);
  }
};

// 选择免疫证明，不立即上传，只保存文件引用
const handleVaccinationProofSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedVaccinationProofFile.value = file;
    // 创建预览 URL
    form.value.vaccination_proof = URL.createObjectURL(file);
  }
};

const removePhoto = () => {
  // 如果是预览 URL，释放它
  if (form.value.photo && form.value.photo.startsWith('blob:')) {
    URL.revokeObjectURL(form.value.photo);
  }
  form.value.photo = '';
  selectedPhotoFile.value = null;
  if (photoInput.value) {
    photoInput.value.value = '';
  }
};

const removeVaccinationProof = () => {
  // 如果是预览 URL，释放它
  if (form.value.vaccination_proof && form.value.vaccination_proof.startsWith('blob:')) {
    URL.revokeObjectURL(form.value.vaccination_proof);
  }
  form.value.vaccination_proof = '';
  selectedVaccinationProofFile.value = null;
  if (vaccinationProofInput.value) {
    vaccinationProofInput.value.value = '';
  }
};


const submitForm = async () => {
  if (!isFormValid.value) {
    let errorMsg = '请填写所有必填字段，并确保救助过程描述在20-200字之间';
    if (form.value.adoption_status && form.value.adoption_status !== '未领养') {
      if (!form.value.adopter_name || !form.value.adopter_phone || !form.value.adopter_address) {
        errorMsg = '请填写完整的领养人信息（姓名、电话、家庭住址）';
      }
    }
    alert(errorMsg);
    return;
  }

  submitting.value = true;
  try {
    // 创建 FormData
    const formData = new FormData();
    
    // 添加所有表单字段
    formData.append('category', form.value.category);
    formData.append('name', form.value.name);
    formData.append('gender', form.value.gender);
    formData.append('age_months', String(form.value.age_months));
    formData.append('is_vaccinated', form.value.is_vaccinated ? '1' : '0');
    formData.append('is_dewormed', form.value.is_dewormed ? '1' : '0');
    formData.append('is_neutered', form.value.is_neutered ? '1' : '0');
    formData.append('rescuer_name', form.value.rescuer_name);
    formData.append('phone', form.value.phone);
    formData.append('rescue_date', form.value.rescue_date);
    formData.append('rescue_location', form.value.rescue_location);
    formData.append('rescue_process', form.value.rescue_process);
    formData.append('is_placed', form.value.is_placed ? '1' : '0');
    if (form.value.adoption_location) {
      formData.append('adoption_location', form.value.adoption_location);
    }
    if (form.value.current_status) {
      formData.append('current_status', form.value.current_status);
    }
    
    // 领养信息
    formData.append('adoption_status', form.value.adoption_status || '未领养');
    if (form.value.adoption_status && form.value.adoption_status !== '未领养') {
      if (form.value.adopter_name) {
        formData.append('adopter_name', form.value.adopter_name);
      }
      if (form.value.adopter_phone) {
        formData.append('adopter_phone', form.value.adopter_phone);
      }
      if (form.value.adopter_address) {
        formData.append('adopter_address', form.value.adopter_address);
      }
      if (form.value.adopter_location) {
        formData.append('adopter_location', form.value.adopter_location);
      }
    }
    
    // 如果有新选择的照片文件，添加它
    if (selectedPhotoFile.value) {
      formData.append('photo', selectedPhotoFile.value);
    } else if (form.value.photo && !form.value.photo.startsWith('blob:')) {
      // 如果已有照片 URL（不是预览），保留它
      formData.append('photo_url', form.value.photo);
    }
    
    // 如果有新选择的免疫证明文件，添加它
    if (selectedVaccinationProofFile.value) {
      formData.append('vaccination_proof', selectedVaccinationProofFile.value);
    } else if (form.value.vaccination_proof && !form.value.vaccination_proof.startsWith('blob:')) {
      // 如果已有免疫证明 URL（不是预览），保留它
      formData.append('vaccination_proof_url', form.value.vaccination_proof);
    }

    await $fetch(`/api/cats/${id.value}`, {
      method: 'PUT',
      body: formData
    });
    
    alert('保存成功！');
    router.push(`/cats/${id.value}`);
  } catch (error: any) {
    alert(error.data?.message || '保存失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const getImageUrl = useImageUrl;

onMounted(() => {
  loadCat();
});
</script>

