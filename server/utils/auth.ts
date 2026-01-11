import jwt from 'jsonwebtoken';
import { getRedisClient } from './redis';
import type { H3Event } from 'h3';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  role_id: number | null;
  role_name: string | null;
  unit_id: number | null;
  unit_name: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'cat-rescue-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REDIS_TOKEN_PREFIX = 'auth:token:';
const REDIS_USER_PREFIX = 'auth:user:';

/**
 * 从请求头中提取 Bearer token
 */
export function extractTokenFromHeader(event: H3Event): string | null {
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 生成 JWT token
 */
export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    role_id: user.role_id,
    role_name: user.role_name,
    unit_id: user.unit_id,
    unit_name: user.unit_name,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
      unit_id: decoded.unit_id,
      unit_name: decoded.unit_name,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 将 token 存储到 Redis
 */
export async function storeTokenInRedis(token: string, user: AuthUser): Promise<void> {
  const redis = getRedisClient();
  const tokenKey = `${REDIS_TOKEN_PREFIX}${token}`;
  const userKey = `${REDIS_USER_PREFIX}${user.id}`;

  // 计算过期时间（7天）
  const expiresIn = 60 * 60 * 24 * 7;

  // 存储 token -> user 映射
  await redis.setex(tokenKey, expiresIn, JSON.stringify(user));

  // 存储 user -> token 映射（用于单点登录，一个用户只能有一个有效 token）
  await redis.setex(userKey, expiresIn, token);
}

/**
 * 从 Redis 获取用户信息
 */
export async function getUserFromRedis(token: string): Promise<AuthUser | null> {
  const redis = getRedisClient();
  const tokenKey = `${REDIS_TOKEN_PREFIX}${token}`;
  
  const userData = await redis.get(tokenKey);
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as AuthUser;
  } catch (error) {
    return null;
  }
}

/**
 * 从 Redis 删除 token
 */
export async function removeTokenFromRedis(token: string, userId?: number): Promise<void> {
  const redis = getRedisClient();
  const tokenKey = `${REDIS_TOKEN_PREFIX}${token}`;
  
  await redis.del(tokenKey);

  if (userId) {
    const userKey = `${REDIS_USER_PREFIX}${userId}`;
    await redis.del(userKey);
  }
}

/**
 * 统一的鉴权函数 - 从请求中获取用户信息
 * @param event H3 事件对象
 * @param requireAuth 是否要求必须登录（默认 true）
 * @returns 用户信息，如果未登录且 requireAuth 为 false 则返回 null
 */
export async function getAuthUser(
  event: H3Event,
  requireAuth: boolean = true
): Promise<AuthUser | null> {
  // 从请求头提取 token
  const token = extractTokenFromHeader(event);

  if (!token) {
    if (requireAuth) {
      throw createError({
        statusCode: 401,
        message: '未登录或 token 无效',
      });
    }
    return null;
  }

  // 先验证 JWT token
  const decodedUser = verifyToken(token);
  if (!decodedUser) {
    if (requireAuth) {
      throw createError({
        statusCode: 401,
        message: 'Token 无效或已过期',
      });
    }
    return null;
  }

  // 从 Redis 验证 token 是否存在（用于支持登出功能）
  const redisUser = await getUserFromRedis(token);
  if (!redisUser) {
    if (requireAuth) {
      throw createError({
        statusCode: 401,
        message: 'Token 已失效，请重新登录',
      });
    }
    return null;
  }

  return redisUser;
}

/**
 * 检查用户是否有权限访问指定页面
 * 注意：这个函数在服务端使用，直接调用 db.ts 中的函数
 */
export async function checkPagePermission(
  user: AuthUser,
  pagePath: string
): Promise<boolean> {
  // 管理员拥有所有权限
  if (user.role_name === 'admin') {
    return true;
  }

  // 如果没有 role_id，则没有权限
  if (!user.role_id) {
    return false;
  }

  try {
    // 直接调用 db.ts 中的函数，但需要检查路径前缀匹配
    const { getAllPages, getRoleById } = await import('./db');
    const pages = await getAllPages();
    const role = await getRoleById(user.role_id);
    
    if (!role || !role.pages || role.pages.length === 0) {
      return false;
    }
    
    // 检查是否有匹配的页面权限（支持路径前缀匹配）
    const hasPermission = role.pages.some((pageId: number) => {
      const page = pages.find((p) => p.id === pageId);
      return page && pagePath.startsWith(page.path);
    });
    
    return hasPermission;
  } catch (error) {
    console.error('权限检查失败:', error);
    return false;
  }
}

