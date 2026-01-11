<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <div v-else-if="!person" class="bg-white rounded-lg shadow p-8 text-center">
      <p class="text-gray-600">人员不存在</p>
      <NuxtLink to="/persons" class="mt-4 inline-block text-blue-600 hover:text-blue-800">
        返回列表
      </NuxtLink>
    </div>

    <div v-else>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
            <input
              v-model="form.birth_date"
              type="date"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label class="block text-sm font-medium text-gray-700 mb-1">所属单位</label>
            <select
              v-model="form.unit_id"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="undefined">请选择单位</option>
              <option v-for="unit in units" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">职位</label>
            <input
              v-model="form.position"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入职位"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              v-model="form.status"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">在职</option>
              <option value="inactive">离职</option>
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
            :to="`/persons/${person.id}`"
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

interface Unit {
  id?: number;
  name: string;
}

const route = useRoute();
const person = ref<Person | null>(null);
const loading = ref(true);
const submitting = ref(false);
const units = ref<Unit[]>([]);

const form = reactive({
  name: '',
  id_card: '',
  phone: '',
  email: '',
  gender: '',
  birth_date: '',
  address: '',
  unit_id: undefined as number | undefined,
  position: '',
  status: 'active',
  notes: ''
});

const loadUnits = async () => {
  try {
    const response = await $fetch('/api/units', {
      params: {
        pageSize: 1000,
        status: 'active'
      }
    });
    units.value = response.data;
  } catch (error) {
    console.error('加载单位列表失败:', error);
  }
};

const loadPerson = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    person.value = await $fetch(`/api/persons/${id}`);
    if (person.value) {
      form.name = person.value.name;
      form.id_card = person.value.id_card || '';
      form.phone = person.value.phone || '';
      form.email = person.value.email || '';
      form.gender = person.value.gender || '';
      form.birth_date = person.value.birth_date || '';
      form.address = person.value.address || '';
      form.unit_id = person.value.unit_id;
      form.position = person.value.position || '';
      form.status = person.value.status || 'active';
      form.notes = person.value.notes || '';
    }
  } catch (error) {
    console.error('加载人员详情失败:', error);
    person.value = null;
  } finally {
    loading.value = false;
  }
};

const submitForm = async () => {
  submitting.value = true;
  try {
    const id = route.params.id as string;
    await $fetch(`/api/persons/${id}`, {
      method: 'PUT',
      body: form
    });
    alert('更新成功');
    navigateTo(`/persons/${id}`);
  } catch (error: any) {
    console.error('更新失败:', error);
    alert(error.data?.message || '更新失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadUnits();
  loadPerson();
});
</script>

