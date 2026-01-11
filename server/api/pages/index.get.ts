import { getAllPages } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const pages = await getAllPages();
  return pages;
});

