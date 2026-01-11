import { getRoleById, getAllPages } from '~/server/utils/db';
import { getAuthUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  
  try {
    
    // 管理员拥有所有菜单权限
    if (user.role_name === 'admin') {
      const allPages = await getAllPages();
      return allPages.map(page => ({
        id: page.id,
        name: page.name,
        path: page.path,
        description: page.description
      }));
    }
    
    // 普通用户根据角色获取菜单
    if (user.role_id) {
      const role = await getRoleById(user.role_id);
      if (role && role.pages && role.pages.length > 0) {
        const allPages = await getAllPages();
        return allPages
          .filter(page => role.pages!.includes(page.id!))
          .map(page => ({
            id: page.id,
            name: page.name,
            path: page.path,
            description: page.description
          }));
      }
    }
    
    return [];
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: '获取菜单失败'
    });
  }
});

