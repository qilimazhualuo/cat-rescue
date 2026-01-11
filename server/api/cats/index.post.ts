import { createCat } from '~/server/utils/db'
import type { Cat } from '~/server/utils/db'
import { readMultipartFormData } from 'h3'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    // 读取 FormData
    const formData = await readMultipartFormData(event)
    if (!formData) {
        throw createError({
            statusCode: 400,
            message: '请求格式错误',
        })
    }

    // 解析 FormData
    const data: any = {}
    let photoFile: any = null
    let vaccinationProofFile: any = null

    for (const field of formData) {
        if (field.name === 'photo' && field.filename) {
            photoFile = field
        } else if (field.name === 'vaccination_proof' && field.filename) {
            vaccinationProofFile = field
        } else if (field.data) {
            const value = field.data.toString('utf-8')
            if (field.name === 'age_months') {
                data[field.name] = parseInt(value) || 0
            } else if (
                field.name === 'is_vaccinated' ||
                field.name === 'is_dewormed' ||
                field.name === 'is_neutered' ||
                field.name === 'is_placed'
            ) {
                data[field.name] = value === '1'
            } else {
                data[field.name] = value
            }
        }
    }

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

    // 处理照片，直接存储到 cats 表
    let photoData: Buffer | undefined
    let photoMimeType: string | undefined
    if (photoFile) {
        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(photoFile.type || '')) {
            throw createError({
                statusCode: 400,
                message: '照片只支持图片格式：jpg, png, gif, webp',
            })
        }

        // 验证文件大小（最大 5MB）
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (photoFile.data.length > maxSize) {
            throw createError({
                statusCode: 400,
                message: '照片大小不能超过 5MB',
            })
        }

        photoData = photoFile.data
        photoMimeType = photoFile.type || 'image/jpeg'
    }

    // 处理免疫证明，直接存储到 cats 表
    let vaccinationProofData: Buffer | undefined
    let vaccinationProofMimeType: string | undefined
    if (vaccinationProofFile) {
        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(vaccinationProofFile.type || '')) {
            throw createError({
                statusCode: 400,
                message: '免疫证明只支持图片格式：jpg, png, gif, webp',
            })
        }

        // 验证文件大小（最大 5MB）
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (vaccinationProofFile.data.length > maxSize) {
            throw createError({
                statusCode: 400,
                message: '免疫证明大小不能超过 5MB',
            })
        }

        vaccinationProofData = vaccinationProofFile.data
        vaccinationProofMimeType = vaccinationProofFile.type || 'image/jpeg'
    }

    // 获取当前登录用户信息
    const user = await getAuthUser(event, true)

    // 确定单位ID：如果前端传了unit_id就用前端的（管理员选择），否则用用户的单位（普通用户）
    let unitId: number | undefined = undefined
    if (data.unit_id !== undefined && data.unit_id !== '') {
        // 管理员可以选择单位
        unitId = parseInt(data.unit_id) || undefined
    } else {
        // 普通用户使用自己的单位
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
        vaccination_proof: undefined, // 不再使用 URL，直接存储数据
        is_dewormed: data.is_dewormed ? 1 : 0,
        is_neutered: data.is_neutered ? 1 : 0,
        photo: undefined, // 不再使用 URL，直接存储数据
        rescuer_name: data.rescuer_name,
        phone: data.phone,
        rescue_date: data.rescue_date,
        rescue_location: data.rescue_location,
        rescue_process: data.rescue_process,
        is_placed: data.is_placed ? 1 : 0,
        adoption_location: data.adoption_location,
        current_status: data.current_status,
        photo_data: photoData,
        photo_mime_type: photoMimeType,
        vaccination_proof_data: vaccinationProofData,
        vaccination_proof_mime_type: vaccinationProofMimeType,
        unit_id: unitId,
    })

    return {
        id: newCat.id,
        message: '创建成功',
    }
})
