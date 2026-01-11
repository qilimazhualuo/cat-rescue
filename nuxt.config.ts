// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // 数据库路径
    dbPath: process.env.DB_PATH || './data/cats.db'
  },
  devServer: {
    port: 25783
  },
  nitro: {
    // 允许上传文件
    experimental: {
      wasm: true
    }
  },
  router: {
    options: {
      strict: false
    }
  }
})

