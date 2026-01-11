import { getCatById } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }
  
  const cat = getCatById(parseInt(id));
  
  if (!cat) {
    throw createError({
      statusCode: 404,
      message: '未找到该猫咪信息'
    });
  }
  
  return cat;
});
