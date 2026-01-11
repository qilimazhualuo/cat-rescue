import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename');
  
  if (!filename) {
    throw createError({
      statusCode: 400,
      message: '缺少文件名'
    });
  }
  
  const filePath = join(process.cwd(), './data/uploads', filename);
  
  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      message: '文件不存在'
    });
  }
  
  // 读取文件
  const fileBuffer = readFileSync(filePath);
  
  // 根据文件扩展名设置 Content-Type
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  
  const contentType = mimeTypes[ext || ''] || 'application/octet-stream';
  
  // 设置响应头
  setHeader(event, 'Content-Type', contentType);
  setHeader(event, 'Cache-Control', 'public, max-age=31536000');
  
  return fileBuffer;
});

