import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), './data/cats.json');

// 确保目录存在
function ensureDir() {
  const dbDir = join(process.cwd(), './data');
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

// 读取数据
function readData(): Cat[] {
  ensureDir();
  if (!existsSync(dbPath)) {
    return [];
  }
  try {
    const content = readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('读取数据失败:', error);
    return [];
  }
}

// 保存数据
function saveData(data: Cat[]) {
  ensureDir();
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error;
  }
}

// 获取所有数据
export function getAllCats(): Cat[] {
  return readData();
}

// 根据ID获取
export function getCatById(id: number): Cat | undefined {
  const cats = readData();
  return cats.find(cat => cat.id === id);
}

// 创建
export function createCat(cat: Omit<Cat, 'id' | 'created_at' | 'updated_at'>): Cat {
  const cats = readData();
  const newCat: Cat = {
    ...cat,
    id: cats.length > 0 ? Math.max(...cats.map(c => c.id || 0)) + 1 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  cats.push(newCat);
  saveData(cats);
  return newCat;
}

// 更新
export function updateCat(id: number, updates: Partial<Omit<Cat, 'id' | 'created_at'>>): Cat | null {
  const cats = readData();
  const index = cats.findIndex(cat => cat.id === id);
  if (index === -1) {
    return null;
  }
  cats[index] = {
    ...cats[index],
    ...updates,
    id,
    updated_at: new Date().toISOString()
  };
  saveData(cats);
  return cats[index];
}

// 删除
export function deleteCat(id: number): boolean {
  const cats = readData();
  const index = cats.findIndex(cat => cat.id === id);
  if (index === -1) {
    return false;
  }
  cats.splice(index, 1);
  saveData(cats);
  return true;
}

// 搜索和筛选
export function searchCats(options: {
  category?: string;
  adoption_status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): { data: Cat[]; total: number; page: number; pageSize: number; totalPages: number } {
  let cats = readData();
  
  // 筛选
  if (options.category) {
    cats = cats.filter(cat => cat.category === options.category);
  }
  
  if (options.adoption_status) {
    cats = cats.filter(cat => (cat.adoption_status || '未领养') === options.adoption_status);
  }
  
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    cats = cats.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm) ||
      cat.rescuer_name.toLowerCase().includes(searchTerm) ||
      cat.phone.includes(searchTerm)
    );
  }
  
  // 排序（按创建时间倒序）
  cats.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
  
  const total = cats.length;
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const offset = (page - 1) * pageSize;
  
  // 分页
  const paginatedCats = cats.slice(offset, offset + pageSize);
  
  return {
    data: paginatedCats,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export interface Cat {
  id?: number;
  category: string;
  name: string;
  gender: string;
  age_months: number;
  is_vaccinated: number;
  vaccination_proof?: string;
  is_dewormed: number;
  is_neutered: number;
  photo?: string;
  rescuer_name: string;
  phone: string;
  rescue_date: string;
  rescue_location: string;
  rescue_process: string;
  is_placed: number;
  adoption_location?: string;
  current_status?: string;
  // 领养信息
  adoption_status?: string; // 已领养、未领养、审核中
  adopter_name?: string; // 领养人姓名
  adopter_phone?: string; // 领养人电话
  adopter_address?: string; // 领养人家庭住址
  adopter_location?: string; // 领养人位置信息（坐标，格式：纬度,经度）
  created_at?: string;
  updated_at?: string;
}
