import { getCatPhoto } from '~/server/utils/db';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }
  
  // 从数据库读取图片
  const image = await getCatPhoto(parseInt(id), 'vaccination_proof');
  
  if (!image) {
    throw createError({
      statusCode: 404,
      message: '图片不存在'
    });
  }
  
  // 设置响应头
  setHeader(event, 'Content-Type', image.mimeType);
  setHeader(event, 'Cache-Control', 'public, max-age=31536000');
  
  return image.data;
});

