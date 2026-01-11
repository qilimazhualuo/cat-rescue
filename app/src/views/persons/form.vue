<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ isEditMode ? '编辑人员信息' : '添加新人员' }}</h1>
    
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <form v-else @submit.prevent="submitForm" class="bg-white rounded-lg shadow-md p-6 space-y-6">
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
          <label class="block text-sm font-medium text-gray-700 mb-1">
            密码 {{ isEditMode ? '' : '*' }}
          </label>
          <input
            v-model="form.password"
            type="password"
            :required="!isEditMode"
            minlength="6"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="isEditMode ? '留空则不修改密码' : '请输入密码（至少6位）'"
          />
          <p class="mt-1 text-xs text-gray-500">
            {{ isEditMode ? '留空则不修改密码' : '密码长度至少6位' }}
          </p>
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
        <RouterLink
          :to="isEditMode ? `/persons/${id}` : '/persons'"
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

interface Unit {
  id?: number;
  name: string;
}

interface Role {
  id?: number;
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

const unitsResponse = ref<{ data: Unit[] } | null>(null);
const units = computed(() => unitsResponse.value?.data || []);

const roles = ref<Role[]>([]);

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

const loadPerson = async () => {
  if (!id.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const person = await $fetch(`/api/persons/${id.value}`);
    form.name = person.name;
    form.id_card = person.id_card || '';
    form.phone = person.phone || '';
    form.gender = person.gender || '';
    form.address = person.address || '';
    form.unit_id = person.unit_id;
    form.notes = person.notes || '';
    form.role_id = person.role_id;
    form.username = person.username || '';
    form.password = ''; // 编辑时不显示密码
  } catch (error: any) {
    if (error.statusCode === 404) {
      alert('未找到该人员信息');
      router.push('/persons');
    } else {
      alert('加载失败: ' + (error.message || '未知错误'));
    }
  } finally {
    loading.value = false;
  }
};

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
  if (!isEditMode.value && (!form.password || form.password.trim() === '')) {
    alert('请输入密码');
    return;
  }
  if (form.password && form.password.length < 6) {
    alert('密码长度至少6位');
    return;
  }

  submitting.value = true;
  try {
    const submitData: any = {
      name: form.name,
      id_card: form.id_card,
      phone: form.phone,
      gender: form.gender,
      address: form.address,
      unit_id: form.unit_id,
      role_id: form.role_id,
      notes: form.notes,
      username: form.username
    };

    // 只有新建或编辑时提供了密码才包含密码字段
    if (form.password && form.password.trim() !== '') {
      submitData.password = form.password;
    }

    if (isEditMode.value) {
      await $fetch(`/api/persons/${id.value}`, {
        method: 'PUT',
        body: submitData
      });
      alert('更新成功');
      router.push(`/persons/${id.value}`);
    } else {
      await $fetch('/api/persons', {
        method: 'POST',
        body: submitData
      });
      alert('创建成功');
      router.push('/persons');
    }
  } catch (error: any) {
    console.error(isEditMode.value ? '更新失败' : '创建失败:', error);
    alert(error.data?.message || (isEditMode.value ? '更新失败' : '创建失败'));
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  // 加载单位列表和角色列表
  try {
    const [unitsData, rolesData] = await Promise.all([
      $fetch<{ data: Unit[] }>('/api/units', {
        query: {
          pageSize: 1000,
          status: 'active'
        }
      }),
      $fetch<Role[]>('/api/roles')
    ]);
    unitsResponse.value = unitsData;
    roles.value = rolesData;
  } catch (error) {
    console.error('加载数据失败:', error);
  }

  // 编辑模式下加载人员数据
  if (isEditMode.value) {
    await loadPerson();
  }
});
</script>

