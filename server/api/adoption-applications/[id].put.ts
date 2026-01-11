import { updateAdoptionApplication, getAdoptionApplicationById } from '~/server/utils/db'
import type { AdoptionApplication } from '~/server/utils/db'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: '缺少ID参数',
        })
    }

    const body = await readBody(event)

    // 检查权限：非管理员只能更新自己单位的猫咪的申请
    let user = null
    try {
        user = await getAuthUser(event, false)
        if (user && user.role_name !== 'admin') {
            // 检查申请是否属于用户单位的猫咪
            const application = await getAdoptionApplicationById(parseInt(id))
            if (application) {
                // 需要检查猫咪是否属于用户单位
                const { getCatById } = await import('~/server/utils/db')
                const cat = await getCatById(application.cat_id)
                if (cat && cat.unit_id !== user.unit_id) {
                    throw createError({
                        statusCode: 403,
                        message: '无权更新该领养申请',
                    })
                }
            }
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }
    }

    const updates: Partial<AdoptionApplication> = {}

    if (body.applicant_name !== undefined) updates.applicant_name = body.applicant_name
    if (body.applicant_phone !== undefined) updates.applicant_phone = body.applicant_phone
    if (body.applicant_id_card !== undefined) updates.applicant_id_card = body.applicant_id_card
    if (body.applicant_address !== undefined) updates.applicant_address = body.applicant_address
    if (body.applicant_location !== undefined) updates.applicant_location = body.applicant_location
    if (body.applicant_email !== undefined) updates.applicant_email = body.applicant_email
    if (body.application_reason !== undefined) updates.application_reason = body.application_reason
    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes

    // 如果状态变为 approved 或 completed，记录审批信息
    if (body.status === 'approved' || body.status === 'completed') {
        if (user) {
            updates.approved_by = user.id
            updates.approved_at = new Date().toISOString()
        }
    }

    const updated = await updateAdoptionApplication(parseInt(id), updates)

    if (!updated) {
        throw createError({
            statusCode: 404,
            message: '未找到该领养申请',
        })
    }

    return updated
})
