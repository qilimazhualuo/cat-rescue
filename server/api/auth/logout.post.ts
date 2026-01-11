import { extractTokenFromHeader, removeTokenFromRedis, getAuthUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // 获取当前用户
    const user = await getAuthUser(event, false);
    
    if (user) {
      // 从请求头提取 token
      const token = extractTokenFromHeader(event);
      if (token) {
        // 从 Redis 删除 token
        await removeTokenFromRedis(token, user.id);
      }
    }
  } catch (error) {
    // 忽略错误，即使 token 无效也返回成功
    console.error('登出时删除 token 失败:', error);
  }
  
  return {
    message: '退出成功'
  };
});

