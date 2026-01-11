import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: '没有上传文件'
    });
  }
  
  const file = formData[0];
  if (!file.data || !file.filename) {
    throw createError({
      statusCode: 400,
      message: '文件格式错误'
    });
  }
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type || '')) {
    throw createError({
      statusCode: 400,
      message: '只支持图片格式：jpg, png, gif, webp'
    });
  }
  
  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      message: '文件大小不能超过 5MB'
    });
  }
  
  // 创建上传目录
  const uploadDir = join(process.cwd(), './data/uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  
  // 生成唯一文件名
  const ext = file.filename.split('.').pop() || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const filePath = join(uploadDir, filename);
  
  // 保存文件
  writeFileSync(filePath, file.data);
  
  // 返回文件路径（使用 API 路由）
  return {
    url: `/api/uploads/${filename}`,
    filename: file.filename,
    size: file.data.length
  };
});

