import { createCat } from '~/server/utils/db';
import type { Cat } from '~/server/utils/db';
import { readMultipartFormData } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
  // 读取 FormData
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: '请求格式错误'
    });
  }

  // 解析 FormData
  const data: any = {};
  let photoFile: any = null;
  let vaccinationProofFile: any = null;

  for (const field of formData) {
    if (field.name === 'photo' && field.filename) {
      photoFile = field;
    } else if (field.name === 'vaccination_proof' && field.filename) {
      vaccinationProofFile = field;
    } else if (field.data) {
      const value = field.data.toString('utf-8');
      if (field.name === 'age_months') {
        data[field.name] = parseInt(value) || 0;
      } else if (field.name === 'is_vaccinated' || field.name === 'is_dewormed' || field.name === 'is_neutered' || field.name === 'is_placed') {
        data[field.name] = value === '1';
      } else {
        data[field.name] = value;
      }
    }
  }

  // 验证必填字段
  if (!data.category || !data.name || !data.gender || !data.rescuer_name || !data.phone || 
      !data.rescue_date || !data.rescue_location || !data.rescue_process) {
    throw createError({
      statusCode: 400,
      message: '缺少必填字段'
    });
  }
  
  // 验证救助过程字数（20-200字）
  if (data.rescue_process.length < 20 || data.rescue_process.length > 200) {
    throw createError({
      statusCode: 400,
      message: '救助过程描述必须在20-200字之间'
    });
  }
  
  // 验证年龄
  if (!data.age_months || data.age_months < 0) {
    throw createError({
      statusCode: 400,
      message: '年龄必须大于等于0'
    });
  }

  // 处理照片上传
  let photoUrl = '';
  if (photoFile) {
    const uploadsDir = join(process.cwd(), 'data', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    const ext = photoFile.filename?.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, filename);
    
    await writeFile(filePath, photoFile.data);
    photoUrl = `/api/uploads/${filename}`;
  }

  // 处理免疫证明上传
  let vaccinationProofUrl = '';
  if (vaccinationProofFile) {
    const uploadsDir = join(process.cwd(), 'data', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    const ext = vaccinationProofFile.filename?.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, filename);
    
    await writeFile(filePath, vaccinationProofFile.data);
    vaccinationProofUrl = `/api/uploads/${filename}`;
  }
  
  const newCat = createCat({
    category: data.category,
    name: data.name,
    gender: data.gender,
    age_months: data.age_months,
    is_vaccinated: data.is_vaccinated ? 1 : 0,
    vaccination_proof: vaccinationProofUrl,
    is_dewormed: data.is_dewormed ? 1 : 0,
    is_neutered: data.is_neutered ? 1 : 0,
    photo: photoUrl,
    rescuer_name: data.rescuer_name,
    phone: data.phone,
    rescue_date: data.rescue_date,
    rescue_location: data.rescue_location,
    rescue_process: data.rescue_process,
    is_placed: data.is_placed ? 1 : 0,
    adoption_location: data.adoption_location,
    current_status: data.current_status
  });
  
  return {
    id: newCat.id,
    message: '创建成功'
  };
});
