import { Elysia } from 'elysia'
import { auth, AuthUser } from '../auth'
import {
    searchCats,
    getCatById,
    createCat,
    updateCat,
    deleteCat,
    getCatPhoto,
    getAdoptionApplicationsByCatId,
} from '../db/db'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

// 解析 multipart form data 的辅助函数
async function parseMultipartFormData(request: Request): Promise<{
    data: Record<string, any>
    photoFile: { data: Buffer; type: string; filename: string } | null
    vaccinationProofFile: { data: Buffer; type: string; filename: string } | null
}> {
    const formData = await request.formData()
    const data: Record<string, any> = {}
    let photoFile: { data: Buffer; type: string; filename: string } | null = null
    let vaccinationProofFile: { data: Buffer; type: string; filename: string } | null = null

    for (const [name, value] of formData.entries()) {
        if (value instanceof File) {
            if (name === 'photo') {
                const buffer = Buffer.from(await value.arrayBuffer())
                photoFile = {
                    data: buffer,
                    type: value.type || 'image/jpeg',
                    filename: value.name || 'photo.jpg',
                }
            } else if (name === 'vaccination_proof') {
                const buffer = Buffer.from(await value.arrayBuffer())
                vaccinationProofFile = {
                    data: buffer,
                    type: value.type || 'image/jpeg',
                    filename: value.name || 'vaccination_proof.jpg',
                }
            }
        } else {
            // 处理普通字段
            if (name === 'age_months') {
                data[name] = parseInt(value as string) || 0
            } else if (
                name === 'is_vaccinated' ||
                name === 'is_dewormed' ||
                name === 'is_neutered' ||
                name === 'is_placed'
            ) {
                data[name] = value === '1' || value === 'true'
            } else {
                data[name] = value
            }
        }
    }

    return { data, photoFile, vaccinationProofFile }
}

// 验证和处理图片文件
function validateImageFile(
    file: { data: Buffer; type: string; filename: string } | null,
    fieldName: string
): { data: Buffer; mimeType: string } | null {
    if (!file) return null

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        throw createError({
            statusCode: 400,
            message: `${fieldName}只支持图片格式：jpg, png, gif, webp`,
        })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.data.length > maxSize) {
        throw createError({
            statusCode: 400,
            message: `${fieldName}大小不能超过 5MB`,
        })
    }

    return {
        data: file.data,
        mimeType: file.type || 'image/jpeg',
    }
}

export default new Elysia({ prefix: '/api/cats' })
    .use(auth)
    // GET /api/cats - 获取猫咪列表（公开接口）
    .get('/', async ({ query, getCurrentUser }) => {
        try {
            // 尝试获取用户，但不强制要求登录
            let user: AuthUser | null = null
            try {
                user = await getCurrentUser()
            } catch {
                // 未登录也可以访问
            }

            let unitId: number | undefined = undefined
            if (query.unit_id !== undefined && query.unit_id !== '') {
                unitId = parseInt(query.unit_id as string) || undefined
            }

            const result = await searchCats({
                category: query.category as string,
                adoption_status: query.adoption_status as string,
                search: query.search as string,
                unit_id: unitId,
                page: parseInt(query.page as string) || 1,
                pageSize: parseInt(query.pageSize as string) || 20,
            })

            return result
        } catch (error: any) {
            throw createError({
                statusCode: error.statusCode || 500,
                message: error.message || '获取猫咪列表失败',
            })
        }
    })
    // GET /api/cats/manage - 管理界面获取猫咪列表（需要登录）
    .get('/manage', async ({ query, getCurrentUser }) => {
        const user = await getCurrentUser()

        let unitId: number | undefined = undefined
        // 管理员可以看到所有数据
        if (user.role_name !== 'admin') {
            // 普通用户只能看到本单位的猫咪
            unitId = user.unit_id || undefined
        }

        const result = await searchCats({
            category: query.category as string,
            adoption_status: query.adoption_status as string,
            search: query.search as string,
            unit_id: unitId,
            page: parseInt(query.page as string) || 1,
            pageSize: parseInt(query.pageSize as string) || 20,
        })

        return result
    })
    // POST /api/cats - 创建猫咪
    .post('/', async ({ request, getCurrentUser }) => {
        const user = await getCurrentUser()
        const { data, photoFile, vaccinationProofFile } = await parseMultipartFormData(request)

        // 验证必填字段
        if (
            !data.category ||
            !data.name ||
            !data.gender ||
            !data.rescuer_name ||
            !data.phone ||
            !data.rescue_date ||
            !data.rescue_location ||
            !data.rescue_process
        ) {
            throw createError({
                statusCode: 400,
                message: '缺少必填字段',
            })
        }

        // 验证救助过程字数（20-200字）
        if (data.rescue_process.length < 20 || data.rescue_process.length > 200) {
            throw createError({
                statusCode: 400,
                message: '救助过程描述必须在20-200字之间',
            })
        }

        // 验证年龄
        if (!data.age_months || data.age_months < 0) {
            throw createError({
                statusCode: 400,
                message: '年龄必须大于等于0',
            })
        }

        // 处理照片
        const photo = validateImageFile(photoFile, '照片')
        // 处理免疫证明
        const vaccinationProof = validateImageFile(vaccinationProofFile, '免疫证明')

        // 确定单位ID
        let unitId: number | undefined = undefined
        if (data.unit_id !== undefined && data.unit_id !== '') {
            unitId = parseInt(data.unit_id) || undefined
        } else {
            unitId = user.unit_id || undefined
        }

        // 验证：普通用户不能选择其他单位
        if (user.role_name !== 'admin' && data.unit_id !== undefined && data.unit_id !== '') {
            const selectedUnitId = parseInt(data.unit_id)
            if (selectedUnitId !== user.unit_id) {
                throw createError({
                    statusCode: 403,
                    message: '普通用户只能为本单位添加猫咪',
                })
            }
        }

        const newCat = await createCat({
            category: data.category,
            name: data.name,
            gender: data.gender,
            age_months: data.age_months,
            is_vaccinated: data.is_vaccinated ? 1 : 0,
            vaccination_proof: undefined,
            is_dewormed: data.is_dewormed ? 1 : 0,
            is_neutered: data.is_neutered ? 1 : 0,
            photo: undefined,
            rescuer_name: data.rescuer_name,
            phone: data.phone,
            rescue_date: data.rescue_date,
            rescue_location: data.rescue_location,
            rescue_process: data.rescue_process,
            is_placed: data.is_placed ? 1 : 0,
            adoption_location: data.adoption_location,
            current_status: data.current_status,
            photo_data: photo?.data,
            photo_mime_type: photo?.mimeType,
            vaccination_proof_data: vaccinationProof?.data,
            vaccination_proof_mime_type: vaccinationProof?.mimeType,
            unit_id: unitId,
        })

        return {
            id: newCat.id,
            message: '创建成功',
        }
    })
    // GET /api/cats/:id - 获取单个猫咪信息
    .get('/:id', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const cat = await getCatById(id)
        if (!cat) {
            throw createError({
                statusCode: 404,
                message: '未找到该猫咪信息',
            })
        }

        return cat
    })
    // GET /api/cats/:id/photo - 获取猫咪照片
    .get('/:id/photo', async ({ params, set }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const image = await getCatPhoto(id, 'photo')
        if (!image) {
            throw createError({
                statusCode: 404,
                message: '图片不存在',
            })
        }

        set.headers['Content-Type'] = image.mimeType
        set.headers['Cache-Control'] = 'public, max-age=31536000'
        return image.data
    })
    // GET /api/cats/:id/vaccination_proof - 获取免疫证明
    .get('/:id/vaccination_proof', async ({ params, set }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const image = await getCatPhoto(id, 'vaccination_proof')
        if (!image) {
            throw createError({
                statusCode: 404,
                message: '图片不存在',
            })
        }

        set.headers['Content-Type'] = image.mimeType
        set.headers['Cache-Control'] = 'public, max-age=31536000'
        return image.data
    })
    // GET /api/cats/:id/applications - 获取猫咪的领养申请
    .get('/:id/applications', async ({ params }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const applications = await getAdoptionApplicationsByCatId(id)
        return applications
    })
    // PUT /api/cats/:id - 更新猫咪信息
    .put('/:id', async ({ params, request, getCurrentUser }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const user = await getCurrentUser()

        // 检查权限：非管理员只能编辑自己单位的猫咪
        if (user.role_name !== 'admin') {
            const cat = await getCatById(id)
            if (!cat) {
                throw createError({
                    statusCode: 404,
                    message: '未找到该猫咪信息',
                })
            }
            if (cat.unit_id !== user.unit_id) {
                throw createError({
                    statusCode: 403,
                    message: '无权编辑该猫咪信息',
                })
            }
        }

        const { data, photoFile, vaccinationProofFile } = await parseMultipartFormData(request)

        // 验证救助过程字数（如果提供了）
        if (data.rescue_process && (data.rescue_process.length < 20 || data.rescue_process.length > 200)) {
            throw createError({
                statusCode: 400,
                message: '救助过程描述必须在20-200字之间',
            })
        }

        // 处理照片
        const photo = validateImageFile(photoFile, '照片')
        // 处理免疫证明
        const vaccinationProof = validateImageFile(vaccinationProofFile, '免疫证明')

        const updates: any = {}

        if (data.category !== undefined) updates.category = data.category
        if (data.name !== undefined) updates.name = data.name
        if (data.gender !== undefined) updates.gender = data.gender
        if (data.age_months !== undefined) updates.age_months = data.age_months
        if (data.is_vaccinated !== undefined) updates.is_vaccinated = data.is_vaccinated ? 1 : 0
        if (data.is_dewormed !== undefined) updates.is_dewormed = data.is_dewormed ? 1 : 0
        if (data.is_neutered !== undefined) updates.is_neutered = data.is_neutered ? 1 : 0
        if (data.rescuer_name !== undefined) updates.rescuer_name = data.rescuer_name
        if (data.phone !== undefined) updates.phone = data.phone
        if (data.rescue_date !== undefined) updates.rescue_date = data.rescue_date
        if (data.rescue_location !== undefined) updates.rescue_location = data.rescue_location
        if (data.rescue_process !== undefined) updates.rescue_process = data.rescue_process
        if (data.is_placed !== undefined) updates.is_placed = data.is_placed ? 1 : 0
        if (data.adoption_location !== undefined) updates.adoption_location = data.adoption_location
        if (data.current_status !== undefined) updates.current_status = data.current_status
        if (data.adoption_status !== undefined) updates.adoption_status = data.adoption_status
        if (data.adopter_name !== undefined) updates.adopter_name = data.adopter_name
        if (data.adopter_phone !== undefined) updates.adopter_phone = data.adopter_phone
        if (data.adopter_address !== undefined) updates.adopter_address = data.adopter_address
        if (data.adopter_location !== undefined) updates.adopter_location = data.adopter_location

        // 图片数据
        if (photo) {
            updates.photo_data = photo.data
            updates.photo_mime_type = photo.mimeType
        }
        if (vaccinationProof) {
            updates.vaccination_proof_data = vaccinationProof.data
            updates.vaccination_proof_mime_type = vaccinationProof.mimeType
        }

        const updated = await updateCat(id, updates)
        if (!updated) {
            throw createError({
                statusCode: 404,
                message: '未找到该猫咪信息',
            })
        }

        return {
            message: '更新成功',
        }
    })
    // DELETE /api/cats/:id - 删除猫咪
    .delete('/:id', async ({ params, getCurrentUser }) => {
        const id = parseInt(params.id)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '缺少ID参数',
            })
        }

        const user = await getCurrentUser()

        // 检查权限：非管理员只能删除自己单位的猫咪
        if (user.role_name !== 'admin') {
            const cat = await getCatById(id)
            if (!cat) {
                throw createError({
                    statusCode: 404,
                    message: '未找到该猫咪信息',
                })
            }
            if (cat.unit_id !== user.unit_id) {
                throw createError({
                    statusCode: 403,
                    message: '无权删除该猫咪信息',
                })
            }
        }

        const success = await deleteCat(id)
        if (!success) {
            throw createError({
                statusCode: 404,
                message: '未找到该猫咪信息',
            })
        }

        return {
            message: '删除成功',
        }
    })

