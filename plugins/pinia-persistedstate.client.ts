import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 确保这个插件在其他插件之前加载（通过文件名前缀 0.）
export default defineNuxtPlugin(({ $pinia }) => {
  if (process.client && $pinia) {
    $pinia.use(piniaPluginPersistedstate);
    console.log('Pinia 持久化插件已加载');
  }
});

