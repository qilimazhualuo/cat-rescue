import { searchUnits, getUnitById } from '~/server/utils/db';
import { getAuthUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // 获取当前登录用户信息（如果有）
  let unitId: number | undefined = undefined;
  try {
    const user = await getAuthUser(event, false);
    // 如果用户有单位且不是管理员，只显示该单位
    if (user && user.role_id && user.role_name !== 'admin') {
      unitId = user.unit_id || undefined;
      // 如果指定了 unit_id，只返回该单位
      if (unitId) {
        const unit = await getUnitById(unitId);
        return {
          data: unit ? [unit] : [],
          total: unit ? 1 : 0,
          page: 1,
          pageSize: 1,
          totalPages: unit ? 1 : 0
        };
      }
    }
  } catch (error) {
    // 未登录或解析失败，显示所有单位
  }
  
  const result = await searchUnits({
    search: query.search as string,
    status: query.status as string,
    page: parseInt(query.page as string) || 1,
    pageSize: parseInt(query.pageSize as string) || 20
  });
  
  return result;
});

