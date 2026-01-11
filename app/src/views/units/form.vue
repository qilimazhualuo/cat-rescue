<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ isEditMode ? '编辑单位信息' : '添加新单位' }}</h1>
    
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <form v-else @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">单位名称 *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入单位名称"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">单位编码</label>
          <input
            v-model="form.code"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入单位编码"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">地址</label>
          <input
            v-model="form.address"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入单位地址"
          />
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
            placeholder="请输入联系人姓名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入联系电话"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入邮箱地址"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            v-model="form.status"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
            placeholder="请输入单位描述信息"
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end space-x-4 pt-4 border-t">
        <RouterLink
          :to="isEditMode ? `/units/${id}` : '/units'"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          取消
        </RouterLink>
        <button
          type="submit"
          :disabled="submitting"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? (isEditMode ? '保存中...' : '提交中...') : (isEditMode ? '保存' : '提交') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import MapPicker from '@/components/MapPicker.vue'

definePageMeta({
  middleware: 'auth'
});

const route = useRoute();
const router = useRouter();

const id = computed(() => {
  const routeId = route.params.id;
  return routeId ? String(routeId) : '';
});

const isEditMode = computed(() => !!id.value);

const loading = ref(isEditMode.value);
const submitting = ref(false);

const form = reactive({
  name: '',
  code: '',
  address: '',
  location: '',
  contact_person: '',
  phone: '',
  email: '',
  description: '',
  status: 'active'
});

const loadUnit = async () => {
  if (!id.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const unit = await $fetch(`/api/units/${id.value}`);
    form.name = unit.name;
    form.code = unit.code || '';
    form.address = unit.address || '';
    form.location = unit.location || '';
    form.contact_person = unit.contact_person || '';
    form.phone = unit.phone || '';
    form.email = unit.email || '';
    form.description = unit.description || '';
    form.status = unit.status || 'active';
  } catch (error: any) {
    if (error.statusCode === 404) {
      alert('未找到该单位信息');
      router.push('/units');
    } else {
      alert('加载失败: ' + (error.message || '未知错误'));
    }
  } finally {
    loading.value = false;
  }
};

const submitForm = async () => {
  submitting.value = true;
  try {
    if (isEditMode.value) {
      await $fetch(`/api/units/${id.value}`, {
        method: 'PUT',
        body: form
      });
      alert('更新成功');
      router.push(`/units/${id.value}`);
    } else {
      await $fetch('/api/units', {
        method: 'POST',
        body: form
      });
      alert('创建成功');
      router.push('/units');
    }
  } catch (error: any) {
    console.error(isEditMode.value ? '更新失败' : '创建失败:', error);
    alert(error.data?.message || (isEditMode.value ? '更新失败' : '创建失败'));
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (isEditMode.value) {
    loadUnit();
  }
});
</script>

