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

        <!-- 领养信息 -->
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">领养信息</h2>
          <div class="space-y-3">
            <div>
              <span class="text-sm font-medium text-gray-500">领养状态：</span>
              <span class="text-gray-800 font-semibold">
                <span v-if="cat.adoption_status === '已领养'" class="text-green-600">已领养</span>
                <span v-else-if="cat.adoption_status === '审核中'" class="text-yellow-600">审核中</span>
                <span v-else class="text-gray-600">未领养</span>
              </span>
            </div>
            
            <div v-if="cat.adoption_status && cat.adoption_status !== '未领养'" class="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 class="text-lg font-semibold text-gray-700 mb-3">领养人信息</h3>
              <div v-if="cat.adopter_name">
                <span class="text-sm font-medium text-gray-500">姓名：</span>
                <span class="text-gray-800">{{ cat.adopter_name }}</span>
              </div>
              <div v-if="cat.adopter_phone">
                <span class="text-sm font-medium text-gray-500">电话：</span>
                <span class="text-gray-800">{{ cat.adopter_phone }}</span>
              </div>
              <div v-if="cat.adopter_address">
                <span class="text-sm font-medium text-gray-500">家庭住址：</span>
                <span class="text-gray-800">{{ cat.adopter_address }}</span>
              </div>
              <div v-if="cat.adopter_location">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-sm font-medium text-gray-500">位置坐标：</span>
                    <span class="text-gray-800 font-mono text-sm">{{ cat.adopter_location }}</span>
                  </div>
                  <button
                    @click="openGaodeNavigation"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                  >
                    导航到该位置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-4 pt-4 border-t">
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

const loadCat = async () => {
  // 如果路径包含 /edit，说明应该显示编辑页面，这里不加载数据
  if (route.path.includes('/edit')) {
    loading.value = false;
    return;
  }
  
  loading.value = true;
  try {
    cat.value = await $fetch(`/api/cats/${id.value}`);
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

// 打开高德地图导航
const openGaodeNavigation = () => {
  if (!cat.value?.adopter_location) {
    alert('没有位置信息');
    return;
  }

  // 解析坐标：格式为 "纬度,经度"
  const [lat, lon] = cat.value.adopter_location.split(',').map(Number);
  
  if (isNaN(lat) || isNaN(lon)) {
    alert('位置坐标格式错误');
    return;
  }

  // 目标位置名称（使用领养人地址或坐标）
  const poiname = cat.value.adopter_address || `位置(${lat},${lon})`;

  // 检测设备类型
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /android/i.test(userAgent);

  let navUrl = '';

  if (isIOS) {
    // iOS 使用 iosamap 协议
    navUrl = `iosamap://navi?sourceApplication=猫咪救助系统&poiname=${encodeURIComponent(poiname)}&lat=${lat}&lon=${lon}&dev=0`;
  } else if (isAndroid) {
    // Android 使用 androidamap 协议
    navUrl = `androidamap://navi?sourceApplication=猫咪救助系统&poiname=${encodeURIComponent(poiname)}&lat=${lat}&lon=${lon}&dev=0`;
  } else {
    // 其他设备使用通用协议
    navUrl = `amapuri://route/plan?dlat=${lat}&dlon=${lon}&dname=${encodeURIComponent(poiname)}&dev=0&t=0`;
  }

  // 尝试打开高德地图
  const link = document.createElement('a');
  link.href = navUrl;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 如果高德地图未安装，可以提示用户
  setTimeout(() => {
    // 这里可以添加检测逻辑，如果高德地图未安装，可以跳转到下载页面或使用网页版
    // 暂时不处理，让用户自己处理
  }, 500);
};

onMounted(() => {
  // 如果路径不包含 /edit，才加载数据
  if (!route.path.includes('/edit')) {
    loadCat();
  }
});
</script>

