import { getAuthUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  // 未登录时返回 null，不抛出 401 错误
  const user = await getAuthUser(event, false);
  return user;
});

