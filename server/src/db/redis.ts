import Redis from 'ioredis'
import config from '@/config'

const redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.database,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    },
    maxRetriesPerRequest: 3,
})

redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err)
})

redisClient.on('connect', () => {
    console.log('Redis连接成功')
})

export { redisClient }

