import { searchCats } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // 首页公开访问，任何人都可以看到所有猫咪
  // 如果传了 unit_id，则按单位筛选；否则显示所有猫咪
  let unitId: number | undefined = undefined;
  if (query.unit_id !== undefined && query.unit_id !== '') {
    unitId = parseInt(query.unit_id as string) || undefined;
  }
  
  const result = await searchCats({
    category: query.category as string,
    adoption_status: query.adoption_status as string,
    search: query.search as string,
    unit_id: unitId, // 根据筛选条件限制单位
    page: parseInt(query.page as string) || 1,
    pageSize: parseInt(query.pageSize as string) || 20
  });
  
  return result;
});
