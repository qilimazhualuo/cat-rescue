import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 确保这个插件在其他插件之前加载（通过文件名前缀 0.）
export default defineNuxtPlugin((nuxtApp) => {
  // 在 Nuxt 3 中使用 @pinia/nuxt 时，通过 nuxtApp.$pinia 访问
  if (process.client) {
    const pinia = nuxtApp.$pinia;
    if (pinia) {
      pinia.use(piniaPluginPersistedstate);
      console.log('Pinia 持久化插件已加载');
    } else {
      console.warn('Pinia 实例未找到');
    }
  }
});

