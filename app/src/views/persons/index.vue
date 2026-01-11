<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <RouterLink
        to="/persons/new"
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        添加新人员
      </RouterLink>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索姓名、身份证、电话、职位..."
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="loadPersons"
        />
        <select
          v-model="filters.status"
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadPersons"
        >
          <option value="">全部状态</option>
          <option value="active">在职</option>
          <option value="inactive">离职</option>
        </select>
        <select
          v-model="filters.gender"
          class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadPersons"
        >
          <option value="">全部性别</option>
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
        <button
          @click="resetFilters"
          class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          重置
        </button>
      </div>
    </div>

    <!-- 人员列表 -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <div v-else-if="persons.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
      <p class="text-gray-600">暂无人员数据</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">性别</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电话</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">职位</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="person in persons" :key="person.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ person.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ person.gender || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ person.phone || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ person.unit_name || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ person.position || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="person.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ person.status === 'active' ? '在职' : '离职' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(person.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <RouterLink
                :to="`/persons/${person.id}`"
                class="text-blue-600 hover:text-blue-900 mr-4"
              >
                查看
              </RouterLink>
              <RouterLink
                :to="`/persons/${person.id}/edit`"
                class="text-indigo-600 hover:text-indigo-900 mr-4"
              >
                编辑
              </RouterLink>
              <button
                @click="deletePerson(person.id!)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            显示第 {{ (pagination.page - 1) * pagination.pageSize + 1 }} - 
            {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} 条，
            共 {{ pagination.total }} 条
          </div>
          <div class="flex space-x-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Person {
  id?: number;
  name: string;
  id_card?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  unit_id?: number;
  unit_name?: string;
  position?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const filters = reactive({
  search: '',
  status: '',
  gender: ''
});

const persons = ref<Person[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
});

const loadPersons = async () => {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      page: pagination.page.toString(),
      pageSize: pagination.pageSize.toString()
    });
    
    if (filters.search) {
      query.append('search', filters.search);
    }
    if (filters.status) {
      query.append('status', filters.status);
    }
    if (filters.gender) {
      query.append('gender', filters.gender);
    }
    
    const response = await $fetch(`/api/persons?${query.toString()}`);
    persons.value = response.data;
    pagination.total = response.total;
    pagination.totalPages = response.totalPages;
  } catch (error) {
    console.error('加载人员列表失败:', error);
    alert('加载人员列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.search = '';
  filters.status = '';
  filters.gender = '';
  pagination.page = 1;
  loadPersons();
};

const changePage = (page: number) => {
  pagination.page = page;
  loadPersons();
};

const deletePerson = async (id: number) => {
  if (!confirm('确定要删除这个人员吗？')) {
    return;
  }
  
  try {
    await $fetch(`/api/persons/${id}`, {
      method: 'DELETE'
    });
    alert('删除成功');
    loadPersons();
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadPersons();
});
</script>

