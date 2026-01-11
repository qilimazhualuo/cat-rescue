import { updateCat } from '~/server/utils/db';
import type { Cat } from '~/server/utils/db';
import { readMultipartFormData } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少ID参数'
    });
  }

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

  // 处理照片上传
  let photoUrl = data.photo_url || '';
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
  let vaccinationProofUrl = data.vaccination_proof_url || '';
  if (vaccinationProofFile) {
    const uploadsDir = join(process.cwd(), 'data', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    const ext = vaccinationProofFile.filename?.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, filename);
    
    await writeFile(filePath, vaccinationProofFile.data);
    vaccinationProofUrl = `/api/uploads/${filename}`;
  }
  
  // 验证救助过程字数（如果提供了）
  if (data.rescue_process && (data.rescue_process.length < 20 || data.rescue_process.length > 200)) {
    throw createError({
      statusCode: 400,
      message: '救助过程描述必须在20-200字之间'
    });
  }
  
  const updates: Partial<Cat> = {};
  
  if (data.category !== undefined) updates.category = data.category;
  if (data.name !== undefined) updates.name = data.name;
  if (data.gender !== undefined) updates.gender = data.gender;
  if (data.age_months !== undefined) updates.age_months = data.age_months;
  if (data.is_vaccinated !== undefined) updates.is_vaccinated = data.is_vaccinated ? 1 : 0;
  if (vaccinationProofUrl) updates.vaccination_proof = vaccinationProofUrl;
  if (data.is_dewormed !== undefined) updates.is_dewormed = data.is_dewormed ? 1 : 0;
  if (data.is_neutered !== undefined) updates.is_neutered = data.is_neutered ? 1 : 0;
  if (photoUrl) updates.photo = photoUrl;
  if (data.rescuer_name !== undefined) updates.rescuer_name = data.rescuer_name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.rescue_date !== undefined) updates.rescue_date = data.rescue_date;
  if (data.rescue_location !== undefined) updates.rescue_location = data.rescue_location;
  if (data.rescue_process !== undefined) updates.rescue_process = data.rescue_process;
  if (data.is_placed !== undefined) updates.is_placed = data.is_placed ? 1 : 0;
  if (data.adoption_location !== undefined) updates.adoption_location = data.adoption_location;
  if (data.current_status !== undefined) updates.current_status = data.current_status;
  // 领养信息
  if (data.adoption_status !== undefined) updates.adoption_status = data.adoption_status;
  if (data.adopter_name !== undefined) updates.adopter_name = data.adopter_name;
  if (data.adopter_phone !== undefined) updates.adopter_phone = data.adopter_phone;
  if (data.adopter_address !== undefined) updates.adopter_address = data.adopter_address;
  if (data.adopter_location !== undefined) updates.adopter_location = data.adopter_location;
  
  const updated = updateCat(parseInt(id), updates);
  
  if (!updated) {
    throw createError({
      statusCode: 404,
      message: '未找到该猫咪信息'
    });
  }
  
  return {
    message: '更新成功'
  };
});
