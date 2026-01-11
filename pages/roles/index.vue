<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <NuxtLink
        to="/roles/new"
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        添加新角色
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <div v-else-if="roles.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
      <p class="text-gray-600">暂无角色数据</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="role in roles" :key="role.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ role.name }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-500">{{ role.description || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(role.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <NuxtLink
                :to="`/roles/edit-${role.id}`"
                class="text-indigo-600 hover:text-indigo-900 mr-4"
              >
                编辑
              </NuxtLink>
              <button
                @click="deleteRole(role.id!)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

interface Role {
  id?: number;
  name: string;
  description?: string;
  pages?: number[];
  created_at?: string;
  updated_at?: string;
}

const roles = ref<Role[]>([]);
const loading = ref(false);

const loadRoles = async () => {
  loading.value = true;
  try {
    roles.value = await $fetch('/api/roles');
  } catch (error) {
    console.error('加载角色列表失败:', error);
    alert('加载角色列表失败');
  } finally {
    loading.value = false;
  }
};

const deleteRole = async (id: number) => {
  if (!confirm('确定要删除这个角色吗？')) {
    return;
  }
  
  try {
    await $fetch(`/api/roles/${id}`, {
      method: 'DELETE'
    });
    alert('删除成功');
    loadRoles();
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
  loadRoles();
});
</script>

