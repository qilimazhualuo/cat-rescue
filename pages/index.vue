<template>
  <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
    <!-- 搜索和筛选 -->
    <div class="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索名称、救助人、手机号..."
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="loadCats"
        />
        <select
          v-model="filters.category"
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadCats"
        >
          <option value="">全部类别</option>
          <option value="猫">猫</option>
          <option value="狗">狗</option>
          <option value="其他">其他</option>
        </select>
        <select
          v-model="filters.adoption_status"
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadCats"
        >
          <option value="">全部领养状态</option>
          <option value="未领养">未领养</option>
          <option value="审核中">审核中</option>
          <option value="已领养">已领养</option>
        </select>
        <select
          v-model="filters.unit_id"
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadCats"
        >
          <option :value="undefined">全部领养机构</option>
          <option v-for="unit in units" :key="unit.id" :value="unit.id">
            {{ unit.name }}
          </option>
        </select>
        <button
          @click="resetFilters"
          class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          重置
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <!-- 猫咪列表 -->
    <div v-else-if="cats.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div
        v-for="cat in cats"
        :key="cat.id"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
      >
        <div v-if="cat.photo" class="h-48 bg-gray-200 overflow-hidden">
          <img :src="getImageUrl(cat.photo)" :alt="cat.name" class="w-full h-full object-cover" />
        </div>
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-gray-800">{{ cat.name }}</h3>
            <span
              :class="[
                'px-2 py-1 rounded text-xs font-semibold',
                cat.adoption_status === '已领养' ? 'bg-green-100 text-green-800' :
                cat.adoption_status === '审核中' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              ]"
            >
              {{ cat.adoption_status || '未领养' }}
            </span>
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            <p><span class="font-semibold">类别：</span>{{ cat.category }}</p>
            <p><span class="font-semibold">性别：</span>{{ cat.gender }}</p>
            <p><span class="font-semibold">年龄：</span>{{ cat.age_months }} 个月</p>
            <p><span class="font-semibold">救助人：</span>{{ cat.rescuer_name }}</p>
            <p><span class="font-semibold">救助日期：</span>{{ cat.rescue_date }}</p>
          </div>
          <div class="mt-4 flex gap-2">
            <NuxtLink
              :to="`/cats/${cat.id}`"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 sm:px-4 rounded transition text-sm sm:text-base"
            >
              查看详情
            </NuxtLink>
            <NuxtLink
              :to="`/adoption-apply/${cat.id}`"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-3 sm:px-4 rounded transition text-sm sm:text-base"
            >
              我要领养
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-12 bg-white rounded-lg shadow">
      <p class="text-gray-500 text-lg">暂无数据</p>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="mt-4 sm:mt-6 flex flex-col items-center gap-3 sm:gap-4">
      <div class="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition text-sm sm:text-base"
        >
          上一页
        </button>
        <div class="flex items-center gap-1 flex-wrap justify-center">
          <span
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'px-2 sm:px-3 py-1 rounded cursor-pointer transition text-sm sm:text-base',
              page === currentPage
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            ]"
          >
            {{ page }}
          </span>
        </div>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition text-sm sm:text-base"
        >
          下一页
        </button>
      </div>
      <div class="text-xs sm:text-sm text-gray-600 text-center px-2">
        第 {{ currentPage }} / {{ totalPages }} 页，共 {{ total }} 条记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 首页不需要登录即可访问，启用 keep-alive
definePageMeta({
  keepalive: true
});

interface Unit {
  id?: number;
  name: string;
}

// 使用 useFetch 实现服务器端渲染 - 单位列表
const { data: unitsResponse } = await useFetch<{ data: Unit[] }>('/api/units', {
  query: {
    pageSize: 1000,
    status: 'active'
  },
  default: () => ({ data: [] })
});
const units = computed(() => unitsResponse.value?.data || []);

const loading = ref(false);
const cats = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);

const filters = ref({
  search: '',
  category: '',
  adoption_status: '',
  unit_id: undefined as number | undefined
});

const loadCats = async () => {
  loading.value = true;
  try {
    const query: any = {
      page: currentPage.value,
      pageSize: pageSize.value
    };
    
    if (filters.value.search) query.search = filters.value.search;
    if (filters.value.category) query.category = filters.value.category;
    if (filters.value.adoption_status) query.adoption_status = filters.value.adoption_status;
    if (filters.value.unit_id !== undefined) query.unit_id = filters.value.unit_id;
    
    const response = await $fetch('/api/cats', { query });
    cats.value = response.data;
    total.value = response.total;
    totalPages.value = response.totalPages;
  } catch (error) {
    console.error('加载失败:', error);
    alert('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    search: '',
    category: '',
    adoption_status: '',
    unit_id: undefined
  };
  currentPage.value = 1;
  loadCats();
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadCats();
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 计算可见的页码
const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 7; // 最多显示7个页码
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const getImageUrl = useImageUrl;

onMounted(() => {
  loadCats();
});
</script>

