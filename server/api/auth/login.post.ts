import { getPersonByUsername, updateLastLogin } from '~/server/utils/db';
import { generateToken, storeTokenInRedis, removeTokenFromRedis } from '~/server/utils/auth';
import type { AuthUser } from '~/server/utils/auth';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.username || !body.password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空'
    });
  }
  
  // 查找用户
  const person = await getPersonByUsername(body.username);
  
  if (!person) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    });
  }
  
  // 检查状态
  if (person.status !== 'active') {
    throw createError({
      statusCode: 403,
      message: '账户已被禁用'
    });
  }
  
  // 验证密码
  if (!person.password) {
    throw createError({
      statusCode: 401,
      message: '该账户未设置密码'
    });
  }
  
  const isValidPassword = await bcrypt.compare(body.password, person.password);
  
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    });
  }
  
  // 更新最后登录时间
  await updateLastLogin(person.id!);
  
  // 创建用户信息（不包含密码）
  const user: AuthUser = {
    id: person.id!,
    username: person.username!,
    name: person.name,
    role: person.role || 'user',
    role_id: person.role_id,
    role_name: person.role_name,
    unit_id: person.unit_id,
    unit_name: person.unit_name
  };
  
  // 如果用户已有 token，先删除旧的（实现单点登录）
  if (person.id) {
    try {
      const redis = (await import('~/server/utils/redis')).getRedisClient();
      const oldToken = await redis.get(`auth:user:${person.id}`);
      if (oldToken) {
        await removeTokenFromRedis(oldToken, person.id);
      }
    } catch (error) {
      // 忽略错误，继续生成新 token
      console.error('删除旧 token 失败:', error);
    }
  }
  
  // 生成 JWT token
  const token = generateToken(user);
  
  // 存储到 Redis
  await storeTokenInRedis(token, user);
  
  return {
    message: '登录成功',
    token: token,
    user: user
  };
});

