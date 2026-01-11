import { deleteAdoptionApplication, getAdoptionApplicationById } from '~/server/utils/db';
import { getAuthUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }
  
  // 检查权限：非管理员只能删除自己单位的猫咪的申请
  try {
    const user = await getAuthUser(event, false);
    if (user && user.role_name !== 'admin') {
      // 检查申请是否属于用户单位的猫咪
      const application = await getAdoptionApplicationById(parseInt(id));
      if (application) {
        // 需要检查猫咪是否属于用户单位
        const { getCatById } = await import('~/server/utils/db');
        const cat = await getCatById(application.cat_id);
        if (cat && cat.unit_id !== user.unit_id) {
          throw createError({
            statusCode: 403,
            message: '无权删除该领养申请'
          });
        }
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
  }
  
  const success = await deleteAdoptionApplication(parseInt(id));
  
  if (!success) {
    throw createError({
      statusCode: 404,
      message: '未找到该领养申请'
    });
  }
  
  return {
    message: '删除成功'
  };
});

