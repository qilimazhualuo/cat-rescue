import { createRole } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: '角色名称不能为空'
    });
  }
  
  const newRole = await createRole({
    name: body.name,
    description: body.description,
    pages: body.pages || []
  });
  
  return {
    id: newRole.id,
    message: '创建成功'
  };
});

