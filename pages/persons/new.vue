<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <form @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入姓名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
          <select
            v-model="form.gender"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
          <input
            v-model="form.id_card"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入身份证号"
            maxlength="18"
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
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
          <input
            v-model="form.username"
            type="text"
            required
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入密码（至少6位）"
          />
          <p class="mt-1 text-xs text-gray-500">密码长度至少6位</p>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">地址</label>
          <input
            v-model="form.address"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入地址"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">所属单位 *</label>
          <select
            v-model="form.unit_id"
            required
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="undefined">请选择单位</option>
            <option v-for="unit in units" :key="unit.id" :value="unit.id">
              {{ unit.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
          <select
            v-model="form.role_id"
            required
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="undefined">请选择角色</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}{{ role.description ? ` - ${role.description}` : '' }}
            </option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            v-model="form.notes"
            rows="4"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入备注信息"
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end space-x-4 pt-4 border-t">
        <NuxtLink
          to="/persons"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          取消
        </NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
interface Unit {
  id?: number;
  name: string;
}

interface Role {
  id?: number;
  name: string;
  description?: string;
}

const form = reactive({
  name: '',
  id_card: '',
  phone: '',
  gender: '',
  address: '',
  unit_id: undefined as number | undefined,
  role_id: undefined as number | undefined,
  notes: '',
  username: '',
  password: ''
});

const submitting = ref(false);

// 使用 useFetch 实现服务器端渲染 - 单位
const { data: unitsResponse } = await useFetch<{ data: Unit[] }>('/api/units', {
  query: {
    pageSize: 1000,
    status: 'active'
  },
  default: () => ({ data: [] })
});
const units = computed(() => {
  return unitsResponse.value?.data || [];
});

// 使用 useFetch 实现服务器端渲染 - 角色
const { data: roles } = await useFetch<Role[]>('/api/roles', {
  default: () => []
});

const submitForm = async () => {
  // 验证必填字段
  if (!form.unit_id) {
    alert('请选择所属单位');
    return;
  }
  if (!form.role_id) {
    alert('请选择角色');
    return;
  }
  if (!form.username || form.username.trim() === '') {
    alert('请输入用户名');
    return;
  }
  if (!form.password || form.password.trim() === '') {
    alert('请输入密码');
    return;
  }
  if (form.password.length < 6) {
    alert('密码长度至少6位');
    return;
  }

  submitting.value = true;
  try {
    await $fetch('/api/persons', {
      method: 'POST',
      body: form
    });
    alert('创建成功');
    navigateTo('/persons');
  } catch (error: any) {
    console.error('创建失败:', error);
    alert(error.data?.message || '创建失败');
  } finally {
    submitting.value = false;
  }
};

</script>

