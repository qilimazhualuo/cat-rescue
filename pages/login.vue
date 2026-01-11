<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">猫咪救助管理系统</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="form.username"
            type="text"
            required
            autocomplete="username"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入密码"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
});

const form = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

const { setToken } = useAuth();

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: form
    });
    
    // 保存 token 和用户信息
    if (response.token && response.user) {
      setToken(response.token, response.user);
    }
    
    // 登录成功，跳转到首页
    await navigateTo('/');
  } catch (err: any) {
    error.value = err.data?.message || '登录失败，请检查用户名和密码';
  } finally {
    loading.value = false;
  }
};
</script>

