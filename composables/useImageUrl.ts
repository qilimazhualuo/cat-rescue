/**
 * 图片 URL 处理工具
 * 处理 blob URL（预览）和 /api/uploads/ 路径
 */
export const useImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  // 如果是 blob URL（预览），直接返回
  if (url.startsWith('blob:')) {
    return url;
  }
  
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果已经是 /api/uploads/ 开头，直接返回
  if (url.startsWith('/api/uploads/')) {
    return url;
  }
  
  // 其他情况直接返回（假设已经是正确的路径）
  return url;
};

