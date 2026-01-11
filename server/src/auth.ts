import Elysia, { t, type Static } from 'elysia'
import { redisClient } from './db/redis'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import config from '@/config'

export interface AuthUser {
    id: number
    username: string
    name: string
    role: string
    role_id: number | null
    role_name: string | null
    unit_id: number | null
    unit_name: string | null
}

export class UnauthorizedError extends Error {
    constructor() {
        super('未授权访问，请先登录')
    }
}

// 用户会话数据结构
const sessionPayload = t.Object({
    id: t.Number(),
    username: t.String(),
    name: t.String(),
    role: t.String(),
    role_id: t.Union([t.Number(), t.Null()]),
    role_name: t.Union([t.String(), t.Null()]),
    unit_id: t.Union([t.Number(), t.Null()]),
    unit_name: t.Union([t.String(), t.Null()]),
})

// 会话配置
const REDIS_TOKEN_PREFIX = 'auth:token:'
const REDIS_USER_PREFIX = 'auth:user:'
const JWT_EXPIRES_IN = '7d'
const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7天（秒）

// 生成 JWT token
function generateToken(user: AuthUser): string {
    const payload = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        role_id: user.role_id,
        role_name: user.role_name,
        unit_id: user.unit_id,
        unit_name: user.unit_name,
    }
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

// 验证 JWT token
function verifyToken(token: string): AuthUser | null {
    try {
        const decoded = jwt.verify(token, config.jwtSecret) as any
        return {
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            role: decoded.role,
            role_id: decoded.role_id,
            role_name: decoded.role_name,
            unit_id: decoded.unit_id,
            unit_name: decoded.unit_name,
        }
    } catch (error) {
        return null
    }
}

// 获取会话键名
function getTokenKey(token: string): string {
    return `${REDIS_TOKEN_PREFIX}${token}`
}

function getUserKey(userId: number): string {
    return `${REDIS_USER_PREFIX}${userId}`
}

export const auth = new Elysia()
    .error({ UNAUTHORIZED: UnauthorizedError })
    .onError(({ set, error, code }) => {
        if (code === 'UNAUTHORIZED') {
            set.status = 200
            return { code: 401, message: error.message }
        }
    })
    .derive({ as: 'global' }, ({ headers }) => ({
        // 创建用户会话
        signUser: async (payload: AuthUser) => {
            const token = generateToken(payload)
            const tokenKey = getTokenKey(token)
            const userKey = getUserKey(payload.id)

            // 将用户信息存储到Redis
            await redisClient.setex(tokenKey, SESSION_EXPIRY, JSON.stringify(payload))
            // 存储 user -> token 映射（用于单点登录）
            await redisClient.setex(userKey, SESSION_EXPIRY, token)

            return { token }
        },

        // 用户登出
        signOut: async () => {
            const authHeader = headers.authorization

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError()
            }

            const token = authHeader.substring(7)
            const tokenKey = getTokenKey(token)

            // 从Redis获取用户信息
            const userData = await redisClient.get(tokenKey)
            if (userData) {
                const user = JSON.parse(userData) as AuthUser
                const userKey = getUserKey(user.id)
                await redisClient.del(userKey)
            }

            // 从Redis中删除会话
            await redisClient.del(tokenKey)

            return { code: 0, message: '注销成功' }
        },

        // 获取当前用户信息
        getCurrentUser: async (): Promise<AuthUser> => {
            const authHeader = headers.authorization

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError()
            }

            const token = authHeader.substring(7)
            const tokenKey = getTokenKey(token)

            // 先验证 JWT token
            const decodedUser = verifyToken(token)
            if (!decodedUser) {
                throw new UnauthorizedError()
            }

            // 从Redis验证 token 是否存在（用于支持登出功能）
            const sessionData = await redisClient.get(tokenKey)

            if (!sessionData) {
                throw new UnauthorizedError()
            }

            try {
                const payload = JSON.parse(sessionData) as AuthUser
                return payload
            } catch (error) {
                throw new UnauthorizedError()
            }
        },
    }))

