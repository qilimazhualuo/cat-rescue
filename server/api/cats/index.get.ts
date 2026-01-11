import { searchCats } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const result = searchCats({
    category: query.category as string,
    adoption_status: query.adoption_status as string,
    search: query.search as string,
    page: parseInt(query.page as string) || 1,
    pageSize: parseInt(query.pageSize as string) || 20
  });
  
  return result;
});
