import { Elysia } from 'elysia'
import { auth } from '../auth'
import {
    searchAdoptionApplications,
    getAdoptionApplicationById,
    createAdoptionApplication,
    updateAdoptionApplication,
    deleteAdoptionApplication,
} from '../db/db'
import { getCatById } from '../db/db'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

export default new Elysia({ prefix: '/api/adoption-applications' })
    .use(auth)
    // GET /api/adoption-applications - 获取领养申请列表
    .get('/', async ({ query }) => {
        const result = await searchAdoptionApplications({
            cat_id: query.cat_id ? parseInt(query.cat_id as string) : undefined,
            status: query.status as string,
            applicant_name: query.applicant_name as string,
            applicant_phone: query.applicant_phone as string,
            page: parseInt(query.page as string) || 1,
            pageSize: parseInt(query.pageSize as string) || 20,
        })

        return result
    })
    // POST /api/adoption-applications - 创建领养申请
    .post('/', async ({ body }) => {
        // 验证必填字段
        if (!body.cat_id || !body.applicant_name || !body.applicant_phone) {
            throw createError({
                statusCode: 400,
                message: '缺少必填字段：cat_id, applicant_name, applicant_phone',
            })
        }

        const application: any = {
            cat_id: parseInt(body.cat_id),
            applicant_name: body.applicant_name,
            applicant_phone: body.applicant_phone,
            applicant_id_card: body.applicant_id_card,
            applicant_address: body.applicant_address,
            applicant_location: body.applicant_location,
            applicant_email: body.applicant_email,
            application_reason: body.application_reason,
            status: body.status || 'pending',
            notes: body.notes,
        }

        const created = await createAdoptionApplication(application)

        return created
    })
    // GET /api/adoption-applications/:id - 获取单个领养申请
    .get('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const application = await getAdoptionApplicationById(id)
        if (!application) {
            throw createError({
                statusCode: 404,
                message: '未找到该领养申请',
            })
        }

        return application
    })
    // PUT /api/adoption-applications/:id - 更新领养申请
    .put('/:id', async ({ params, body, getCurrentUser }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        // 检查权限：非管理员只能更新自己单位的猫咪的申请
        let user = null
        try {
            user = await getCurrentUser()
            if (user && user.role_name !== 'admin') {
                // 检查申请是否属于用户单位的猫咪
                const application = await getAdoptionApplicationById(id)
                if (application) {
                    // 需要检查猫咪是否属于用户单位
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

        const updates: any = {}

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

        const updated = await updateAdoptionApplication(id, updates)
        if (!updated) {
            throw createError({
                statusCode: 404,
                message: '未找到该领养申请',
            })
        }

        return updated
    })
    // DELETE /api/adoption-applications/:id - 删除领养申请
    .delete('/:id', async ({ params, getCurrentUser }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        // 检查权限：非管理员只能删除自己单位的猫咪的申请
        try {
            const user = await getCurrentUser()
            if (user && user.role_name !== 'admin') {
                // 检查申请是否属于用户单位的猫咪
                const application = await getAdoptionApplicationById(id)
                if (application) {
                    // 需要检查猫咪是否属于用户单位
                    const cat = await getCatById(application.cat_id)
                    if (cat && cat.unit_id !== user.unit_id) {
                        throw createError({
                            statusCode: 403,
                            message: '无权删除该领养申请',
                        })
                    }
                }
            }
        } catch (error: any) {
            if (error.statusCode) {
                throw error
            }
        }

        const success = await deleteAdoptionApplication(id)
        if (!success) {
            throw createError({
                statusCode: 404,
                message: '未找到该领养申请',
            })
        }

        return {
            message: '删除成功',
        }
    })

