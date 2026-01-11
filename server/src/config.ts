interface DatabaseConfig {
    user: string
    host: string
    database: string
    password: string
    port: number
}

interface RedisConfig {
    url?: string
    host: string
    port: number
    password?: string
    database?: number
}

interface Config {
    database: DatabaseConfig
    redis: RedisConfig
    jwtSecret: string
}

const config: Config = {
    database: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'cat_rescue',
        password: process.env.DB_PASSWORD || '123zhangbei',
        port: parseInt(process.env.DB_PORT || '5432'),
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
    },
    jwtSecret: process.env.JWT_SECRET || 'cat-rescue-secret-key-change-in-production',
}

export default config

