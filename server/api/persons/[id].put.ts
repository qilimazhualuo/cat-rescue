import { updatePerson, updatePersonPassword } from '~/server/utils/db';
import type { Person } from '~/server/utils/db';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }

  const body = await readBody(event);
  
  // 验证必填字段
  if (body.unit_id !== undefined && !body.unit_id) {
    throw createError({
      statusCode: 400,
      message: '所属单位不能为空'
    });
  }
  
  if (body.role_id !== undefined && !body.role_id) {
    throw createError({
      statusCode: 400,
      message: '角色不能为空'
    });
  }
  
  if (body.username !== undefined && (!body.username || body.username.trim() === '')) {
    throw createError({
      statusCode: 400,
      message: '用户名不能为空'
    });
  }
  
  if (!body.password || body.password.trim() === '') {
    throw createError({
      statusCode: 400,
      message: '密码不能为空'
    });
  }
  
  if (body.password.length < 6) {
    throw createError({
      statusCode: 400,
      message: '密码长度至少6位'
    });
  }
  
  const updates: Partial<Person> = {};
  
  if (body.name !== undefined) updates.name = body.name;
  if (body.id_card !== undefined) updates.id_card = body.id_card;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.gender !== undefined) updates.gender = body.gender;
  if (body.address !== undefined) updates.address = body.address;
  if (body.unit_id !== undefined) updates.unit_id = body.unit_id ? parseInt(body.unit_id) : null;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.role_id !== undefined) updates.role_id = body.role_id ? parseInt(body.role_id) : null;
  if (body.username !== undefined) updates.username = body.username;
  
  // 加密并更新密码
  const hashedPassword = await bcrypt.hash(body.password, 10);
  await updatePersonPassword(parseInt(id), hashedPassword);
  
  const updated = await updatePerson(parseInt(id), updates);
  
  if (!updated) {
    throw createError({
      statusCode: 404,
      message: '未找到该人员信息'
    });
  }
  
  return {
    message: '更新成功'
  };
});

