import { createAdoptionApplication } from '~/server/utils/db';
import type { AdoptionApplication } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // 验证必填字段
  if (!body.cat_id || !body.applicant_name || !body.applicant_phone) {
    throw createError({
      statusCode: 400,
      message: '缺少必填字段：cat_id, applicant_name, applicant_phone'
    });
  }
  
  const application: Omit<AdoptionApplication, 'id' | 'created_at' | 'updated_at'> = {
    cat_id: parseInt(body.cat_id),
    applicant_name: body.applicant_name,
    applicant_phone: body.applicant_phone,
    applicant_id_card: body.applicant_id_card,
    applicant_address: body.applicant_address,
    applicant_location: body.applicant_location,
    applicant_email: body.applicant_email,
    application_reason: body.application_reason,
    status: body.status || 'pending',
    notes: body.notes
  };
  
  const created = await createAdoptionApplication(application);
  
  return created;
});

