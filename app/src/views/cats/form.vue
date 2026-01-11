<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ isEditMode ? '编辑猫咪信息' : '添加新猫咪' }}</h1>
    
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <form v-else @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <!-- 基本信息 -->
      <div class="border-b pb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">基本信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="!isEditMode">
            <label class="block text-sm font-medium text-gray-700 mb-1">所属单位 *</label>
            <select
              v-if="isAdmin"
              v-model="form.unit_id"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="undefined">请选择单位</option>
              <option v-for="unit in units" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </option>
            </select>
            <input
              v-else
              :value="currentUserUnitName"
              type="text"
              readonly
              class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>

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

      <!-- 提交按钮 -->
      <div class="flex gap-4 pt-4">
        <button
          type="submit"
          :disabled="submitting || !isFormValid"
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          {{ submitting ? (isEditMode ? '保存中...' : '提交中...') : (isEditMode ? '保存' : '提交') }}
        </button>
        <RouterLink
          :to="isEditMode ? `/cats/${id}` : '/'"
          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
        >
          取消
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useImageUrl } from '@/composables/useImageUrl'

definePageMeta({
  middleware: 'auth'
});

interface Unit {
  id?: number;
  name: string;
}

const route = useRoute();
const router = useRouter();

// 从路由参数获取 ID，判断是新建还是编辑
const id = computed(() => {
  const routeId = route.params.id;
  return routeId ? String(routeId) : '';
});

const isEditMode = computed(() => !!id.value);

// 加载单位列表（仅新建时需要）
const unitsResponse = ref<{ data: Unit[] } | null>(null);
const units = computed(() => unitsResponse.value?.data || []);

// 获取当前用户信息
const currentUser = ref<any>(null);

const isAdmin = computed(() => {
  return currentUser.value?.role_name === 'admin';
});

const currentUserUnitName = computed(() => {
  return currentUser.value?.unit_name || '未知单位';
});

const loading = ref(isEditMode.value);
const submitting = ref(false);
const photoInput = ref<HTMLInputElement | null>(null);
const vaccinationProofInput = ref<HTMLInputElement | null>(null);
const selectedPhotoFile = ref<File | null>(null);
const selectedVaccinationProofFile = ref<File | null>(null);

const form = ref({
  unit_id: undefined as number | undefined,
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
  current_status: ''
});

// 初始化单位ID：普通用户使用自己的单位，管理员可以后续选择（仅新建时）
if (!isEditMode.value) {
  watchEffect(() => {
    if (!isAdmin.value && currentUser.value?.unit_id && !form.value.unit_id) {
      form.value.unit_id = currentUser.value.unit_id;
    }
  });
}

// 加载现有数据（仅编辑模式）
const loadCat = async () => {
  if (!id.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const cat = await $fetch(`/api/cats/${id.value}`);
    form.value = {
      unit_id: undefined, // 编辑时不需要单位字段
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
      current_status: cat.current_status || ''
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

const isFormValid = computed(() => {
  const baseValid = (
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
  );
  
  // 新建时需要验证 unit_id
  if (!isEditMode.value) {
    return baseValid && form.value.unit_id !== undefined;
  }
  
  return baseValid;
});

const submitForm = async () => {
  if (!isFormValid.value) {
    alert('请填写所有必填字段，并确保救助过程描述在20-200字之间');
    return;
  }

  submitting.value = true;
  try {
    // 创建 FormData
    const formData = new FormData();
    
    // 添加所有表单字段
    if (!isEditMode.value && form.value.unit_id !== undefined) {
      formData.append('unit_id', String(form.value.unit_id));
    }
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
    
    // 处理照片
    if (selectedPhotoFile.value) {
      formData.append('photo', selectedPhotoFile.value);
    } else if (isEditMode.value && form.value.photo && !form.value.photo.startsWith('blob:')) {
      // 编辑模式下，如果已有照片 URL（不是预览），保留它
      formData.append('photo_url', form.value.photo);
    }
    
    // 处理免疫证明
    if (selectedVaccinationProofFile.value) {
      formData.append('vaccination_proof', selectedVaccinationProofFile.value);
    } else if (isEditMode.value && form.value.vaccination_proof && !form.value.vaccination_proof.startsWith('blob:')) {
      // 编辑模式下，如果已有免疫证明 URL（不是预览），保留它
      formData.append('vaccination_proof_url', form.value.vaccination_proof);
    }

    if (isEditMode.value) {
      // 编辑模式：PUT
      await $fetch(`/api/cats/${id.value}`, {
        method: 'PUT',
        body: formData
      });
      alert('保存成功！');
      router.push(`/cats/${id.value}`);
    } else {
      // 新建模式：POST
      await $fetch('/api/cats', {
        method: 'POST',
        body: formData
      });
      alert('添加成功！');
      router.push('/');
    }
  } catch (error: any) {
    alert(error.data?.message || (isEditMode.value ? '保存失败，请重试' : '添加失败，请重试'));
  } finally {
    submitting.value = false;
  }
};

const getImageUrl = useImageUrl;

// 加载初始数据
onMounted(async () => {
  // 新建模式下加载单位列表和用户信息
  if (!isEditMode.value) {
    try {
      const [unitsData, userData] = await Promise.all([
        $fetch<{ data: Unit[] }>('/api/units', {
          query: {
            pageSize: 1000,
            status: 'active'
          }
        }),
        $fetch('/api/auth/me').catch(() => null)
      ]);
      unitsResponse.value = unitsData;
      currentUser.value = userData;
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  } else {
    // 编辑模式下只加载用户信息（用于判断是否管理员）
    try {
      currentUser.value = await $fetch('/api/auth/me').catch(() => null);
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
    // 加载猫咪数据
    loadCat();
  }
});
</script>

