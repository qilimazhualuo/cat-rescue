import Redis from 'ioredis'
import { useRuntimeConfig } from '#imports'

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
    if (redisClient) {
        return redisClient
    }

    const config = useRuntimeConfig()

    redisClient = new Redis({
        host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
        port: config.redis?.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: config.redis?.password || process.env.REDIS_PASSWORD || undefined,
        db: config.redis?.db || parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: times => {
            const delay = Math.min(times * 50, 2000)
            return delay
        },
        maxRetriesPerRequest: 3,
    })

    redisClient.on('error', err => {
        console.error('Redis连接错误:', err)
    })

    redisClient.on('connect', () => {
        console.log('Redis连接成功')
    })

    return redisClient
}

export async function closeRedisConnection() {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
    }
}
