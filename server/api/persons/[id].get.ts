import { getPersonById } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }
  
  const person = await getPersonById(parseInt(id));
  
  if (!person) {
    throw createError({
      statusCode: 404,
      message: '未找到该人员信息'
    });
  }
  
  return person;
});

