<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <div v-else-if="cat" class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- 照片 -->
      <div v-if="cat.photo" class="h-64 bg-gray-200 overflow-hidden">
        <img :src="getImageUrl(cat.photo)" :alt="cat.name" class="w-full h-full object-cover" />
      </div>

      <div class="p-6">
        <!-- 标题和状态 -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">{{ cat.name }}</h1>
            <p class="text-gray-600 mt-1">{{ cat.category }} · {{ cat.gender }} · {{ cat.age_months }} 个月</p>
          </div>
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-semibold',
              cat.is_placed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            ]"
          >
            {{ cat.is_placed ? '已安置' : '未安置' }}
          </span>
        </div>

        <!-- 健康信息 -->
        <div class="border-b pb-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">健康信息</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex items-center space-x-2">
              <span :class="cat.is_vaccinated ? 'text-green-600' : 'text-gray-400'">
                {{ cat.is_vaccinated ? '✓' : '✗' }}
              </span>
              <span class="text-sm text-gray-700">免疫</span>
            </div>
            <div class="flex items-center space-x-2">
              <span :class="cat.is_dewormed ? 'text-green-600' : 'text-gray-400'">
                {{ cat.is_dewormed ? '✓' : '✗' }}
              </span>
              <span class="text-sm text-gray-700">驱虫</span>
            </div>
            <div class="flex items-center space-x-2">
              <span :class="cat.is_neutered ? 'text-green-600' : 'text-gray-400'">
                {{ cat.is_neutered ? '✓' : '✗' }}
              </span>
              <span class="text-sm text-gray-700">绝育</span>
            </div>
          </div>
          <div v-if="cat.is_vaccinated && cat.vaccination_proof" class="mt-4">
            <span class="text-sm font-medium text-gray-500 block mb-2">免疫证明：</span>
            <img 
              :src="getImageUrl(cat.vaccination_proof)" 
              alt="免疫证明" 
              class="max-w-md h-auto rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
              @click="openImageModal(getImageUrl(cat.vaccination_proof))"
            />
          </div>
        </div>

        <!-- 救助信息 -->
        <div class="border-b pb-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">救助信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-sm font-medium text-gray-500">救助人：</span>
              <span class="text-gray-800">{{ cat.rescuer_name }}</span>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">手机号：</span>
              <span class="text-gray-800">{{ cat.phone }}</span>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">救助日期：</span>
              <span class="text-gray-800">{{ cat.rescue_date }}</span>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">救助地点：</span>
              <span class="text-gray-800">{{ cat.rescue_location }}</span>
            </div>
          </div>
          <div class="mt-4">
            <span class="text-sm font-medium text-gray-500 block mb-2">救助过程：</span>
            <p class="text-gray-800 whitespace-pre-wrap">{{ cat.rescue_process }}</p>
          </div>
        </div>

        <!-- 安置信息 -->
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">安置信息</h2>
          <div v-if="cat.is_placed && cat.adoption_location" class="mb-4">
            <span class="text-sm font-medium text-gray-500">领养地点：</span>
            <span class="text-gray-800">{{ cat.adoption_location }}</span>
          </div>
          <div v-if="cat.current_status">
            <span class="text-sm font-medium text-gray-500 block mb-2">宠物现状：</span>
            <p class="text-gray-800 whitespace-pre-wrap">{{ cat.current_status }}</p>
          </div>
        </div>

        <!-- 领养申请 -->
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">领养申请</h2>
          
          <div v-if="applicationsLoading" class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600 text-sm">加载中...</p>
          </div>
          
          <div v-else-if="applications.length > 0" class="space-y-3">
            <div
              v-for="app in applications"
              :key="app.id"
              class="bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="text-lg font-semibold text-gray-800">{{ app.applicant_name }}</h3>
                  <p class="text-sm text-gray-600">{{ app.applicant_phone }}</p>
                </div>
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-semibold',
                    app.status === 'completed' ? 'bg-green-100 text-green-800' :
                    app.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ getStatusText(app.status) }}
                </span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                <div v-if="app.applicant_id_card">
                  <span class="font-medium">身份证：</span>{{ app.applicant_id_card }}
                </div>
                <div v-if="app.applicant_email">
                  <span class="font-medium">邮箱：</span>{{ app.applicant_email }}
                </div>
                <div v-if="app.applicant_address" class="md:col-span-2">
                  <span class="font-medium">地址：</span>{{ app.applicant_address }}
                </div>
                <div v-if="app.application_reason" class="md:col-span-2">
                  <span class="font-medium">申请理由：</span>{{ app.application_reason }}
                </div>
                <div class="md:col-span-2 text-xs text-gray-500">
                  申请时间：{{ formatDate(app.created_at) }}
                </div>
              </div>
              
              <div v-if="user" class="flex gap-2 mt-3">
                <button
                  v-if="app.status === 'pending'"
                  @click="updateApplicationStatus(app.id!, 'approved')"
                  class="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 rounded transition"
                >
                  通过
                </button>
                <button
                  v-if="app.status === 'pending'"
                  @click="updateApplicationStatus(app.id!, 'rejected')"
                  class="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-3 rounded transition"
                >
                  拒绝
                </button>
                <button
                  v-if="app.status === 'approved'"
                  @click="updateApplicationStatus(app.id!, 'completed')"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded transition"
                >
                  完成领养
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
            <p class="text-gray-500">暂无领养申请</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="user" class="flex gap-4 pt-4 border-t">
          <button
            @click="goToEdit"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            编辑
          </button>
          <button
            @click="deleteCat"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            删除
          </button>
          <NuxtLink
            to="/"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
          >
            返回列表
          </NuxtLink>
        </div>
        <div v-else class="flex gap-4 pt-4 border-t">
          <NuxtLink
            :to="`/adoption-apply/${cat.id}`"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
          >
            我要领养
          </NuxtLink>
          <NuxtLink
            to="/"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
          >
            返回列表
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 bg-white rounded-lg shadow">
      <p class="text-gray-500 text-lg">未找到该猫咪信息</p>
      <NuxtLink to="/" class="text-blue-600 hover:underline mt-4 inline-block">返回列表</NuxtLink>
    </div>

  </div>
</template>

<style scoped>
img {
  max-height: 400px;
}
</style>

<script setup lang="ts">
// 确保详情页只匹配精确的 /cats/:id（不匹配 /edit）
definePageMeta({
  key: (route) => {
    // 如果路径包含 /edit，返回不同的 key，让 Nuxt 知道这不是详情页
    if (route.path.includes('/edit')) {
      return `cat-detail-edit-redirect-${route.params.id}`;
    }
    return `cat-detail-${route.params.id}`;
  }
});

const route = useRoute();
const router = useRouter();

// 如果路径包含 /edit，重定向到新的编辑页面路径
if (process.client && route.path.includes('/edit')) {
  const pathParts = route.path.split('/').filter(p => p);
  const catsIndex = pathParts.indexOf('cats');
  if (catsIndex >= 0 && pathParts[catsIndex + 1] && pathParts[catsIndex + 2] === 'edit') {
    const actualId = pathParts[catsIndex + 1];
    navigateTo(`/cats/edit-${actualId}`, { replace: true });
  }
}

// 如果路径包含 /edit，说明路由匹配错误，应该显示编辑页面，这里不加载数据
const id = computed(() => {
  return String(route.params.id || '');
});

const loading = ref(true);
const cat = ref<any>(null);
const applications = ref<any[]>([]);
const applicationsLoading = ref(false);
const user = ref<any>(null);

const loadUser = async () => {
  try {
    user.value = await $fetch('/api/auth/me');
  } catch (error) {
    user.value = null;
  }
};

const loadApplications = async () => {
  if (!cat.value?.id) return;
  applicationsLoading.value = true;
  try {
    applications.value = await $fetch(`/api/cats/${cat.value.id}/applications`);
  } catch (error) {
    console.error('加载领养申请失败:', error);
  } finally {
    applicationsLoading.value = false;
  }
};

const loadCat = async () => {
  // 如果路径包含 /edit，说明应该显示编辑页面，这里不加载数据
  if (route.path.includes('/edit')) {
    loading.value = false;
    return;
  }
  
  loading.value = true;
  try {
    cat.value = await $fetch(`/api/cats/${id.value}`);
    await loadApplications();
  } catch (error: any) {
    if (error.statusCode === 404) {
      cat.value = null;
    } else {
      alert('加载失败');
    }
  } finally {
    loading.value = false;
  }
};

const updateApplicationStatus = async (id: number, status: string) => {
  try {
    await $fetch(`/api/adoption-applications/${id}`, {
      method: 'PUT',
      body: { status }
    });
    alert('更新成功');
    await loadApplications();
    // 如果状态变为 completed，更新猫咪的 adoption_status
    if (status === 'completed' && cat.value) {
      await $fetch(`/api/cats/${cat.value.id}`, {
        method: 'PUT',
        body: { adoption_status: '已领养' }
      });
      await loadCat();
    }
  } catch (error: any) {
    alert(error.data?.message || '更新失败');
  }
};

const deleteApplication = async (id: number) => {
  if (!confirm('确定要删除该申请吗？')) return;
  
  try {
    await $fetch(`/api/adoption-applications/${id}`, {
      method: 'DELETE'
    });
    alert('删除成功');
    await loadApplications();
  } catch (error: any) {
    alert(error.data?.message || '删除失败');
  }
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成'
  };
  return statusMap[status] || status;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const deleteCat = async () => {
  if (!confirm('确定要删除这条记录吗？')) {
    return;
  }

  try {
    await $fetch(`/api/cats/${id.value}`, {
      method: 'DELETE'
    });
    alert('删除成功');
    router.push('/');
  } catch (error: any) {
    alert(error.data?.message || '删除失败');
  }
};

const getImageUrl = useImageUrl;

const openImageModal = (imageUrl: string) => {
  // 简单的图片查看：在新窗口打开
  window.open(imageUrl, '_blank');
};

const goToEdit = () => {
  if (cat.value?.id) {
    navigateTo(`/cats/edit-${cat.value.id}`, { replace: false });
  }
};

onMounted(async () => {
  await loadUser();
  // 如果路径不包含 /edit，才加载数据
  if (!route.path.includes('/edit')) {
    loadCat();
  }
});
</script>

