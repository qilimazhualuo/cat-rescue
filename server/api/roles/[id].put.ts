import { updateRole } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }

  const body = await readBody(event);
  
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.pages !== undefined) updates.pages = body.pages;
  
  const updated = await updateRole(parseInt(id), updates);
  
  if (!updated) {
    throw createError({
      statusCode: 404,
      message: '未找到该角色'
    });
  }
  
  return {
    message: '更新成功'
  };
});

