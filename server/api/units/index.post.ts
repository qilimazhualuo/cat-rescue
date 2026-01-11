import { createUnit } from '~/server/utils/db';
import type { Unit } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // 验证必填字段
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: '单位名称不能为空'
    });
  }
  
  // 检查名称是否已存在
  const { getAllUnits } = await import('~/server/utils/db');
  const existingUnits = await getAllUnits();
  if (existingUnits.some(u => u.name === body.name && u.id !== body.id)) {
    throw createError({
      statusCode: 400,
      message: '单位名称已存在'
    });
  }
  
  const newUnit = await createUnit({
    name: body.name,
    code: body.code,
    address: body.address,
    location: body.location,
    contact_person: body.contact_person,
    phone: body.phone,
    email: body.email,
    description: body.description,
    status: body.status || 'active'
  });
  
  return {
    id: newUnit.id,
    message: '创建成功'
  };
});

