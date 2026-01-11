// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
    css: ['~/assets/css/main.css'],
    runtimeConfig: {
        // PostgreSQL 数据库配置
        db: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'cat_rescue',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '123zhangbei',
        },
        // Redis 配置
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0'),
        },
        // JWT 密钥
        jwtSecret: process.env.JWT_SECRET || 'cat-rescue-secret-key-change-in-production',
    },
    devServer: {
        port: 3000,
    },
    nitro: {
        // 允许上传文件
        experimental: {
            wasm: true,
        },
    },
    router: {
        options: {
            strict: false,
        },
    },
})
