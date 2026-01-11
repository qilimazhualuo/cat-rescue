<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ isEditMode ? '编辑角色信息' : '添加新角色' }}</h1>
    
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <form v-else @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div class="grid grid-cols-1 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">角色名称 *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入角色名称"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入角色描述"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">页面权限</label>
          <div class="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div v-for="page in pages" :key="page.id" class="mb-2">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  :value="page.id"
                  v-model="form.pages"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">{{ page.name }}</span>
                <span class="text-xs text-gray-500">({{ page.path }})</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-4 pt-4 border-t">
        <RouterLink
          to="/roles"
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
definePageMeta({
  middleware: 'auth'
});

interface Page {
  id?: number;
  path: string;
  name: string;
  description?: string;
}

const route = useRoute();
const router = useRouter();

const id = computed(() => {
  const routeId = route.params.id;
  return routeId ? String(routeId) : '';
});

const isEditMode = computed(() => !!id.value);

const loading = ref(isEditMode.value);
const submitting = ref(false);
const pages = ref<Page[]>([]);

const form = reactive({
  name: '',
  description: '',
  pages: [] as number[]
});

const loadRole = async () => {
  if (!id.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const role = await $fetch(`/api/roles/${id.value}`);
    form.name = role.name;
    form.description = role.description || '';
    form.pages = role.pages || [];
  } catch (error: any) {
    if (error.statusCode === 404) {
      alert('未找到该角色信息');
      router.push('/roles');
    } else {
      alert('加载失败: ' + (error.message || '未知错误'));
    }
  } finally {
    loading.value = false;
  }
};

const loadPages = async () => {
  try {
    pages.value = await $fetch('/api/pages');
  } catch (error) {
    console.error('加载页面列表失败:', error);
  }
};

const submitForm = async () => {
  submitting.value = true;
  try {
    if (isEditMode.value) {
      await $fetch(`/api/roles/${id.value}`, {
        method: 'PUT',
        body: form
      });
      alert('更新成功');
      router.push('/roles');
    } else {
      await $fetch('/api/roles', {
        method: 'POST',
        body: form
      });
      alert('创建成功');
      router.push('/roles');
    }
  } catch (error: any) {
    console.error(isEditMode.value ? '更新失败' : '创建失败:', error);
    alert(error.data?.message || (isEditMode.value ? '更新失败' : '创建失败'));
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await loadPages();
  if (isEditMode.value) {
    await loadRole();
  }
});
</script>

