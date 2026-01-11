import { Elysia } from 'elysia'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Elysia 的 createError 等价函数
function createError(options: { statusCode: number; message: string }) {
    const error = new Error(options.message) as any
    error.statusCode = options.statusCode
    return error
}

export default new Elysia({ prefix: '/api/uploads' })
    // GET /api/uploads/:filename - 获取上传的文件
    .get('/:filename', async ({ params, set }) => {
        const filename = params.filename

        if (!filename) {
            throw createError({
                statusCode: 400,
                message: '缺少文件名',
            })
        }

        const filePath = join(process.cwd(), './data/uploads', filename)

        if (!existsSync(filePath)) {
            throw createError({
                statusCode: 404,
                message: '文件不存在',
            })
        }

        // 读取文件
        const fileBuffer = readFileSync(filePath)

        // 根据文件扩展名设置 Content-Type
        const ext = filename.split('.').pop()?.toLowerCase()
        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        }

        const contentType = mimeTypes[ext || ''] || 'application/octet-stream'

        // 设置响应头
        set.headers['Content-Type'] = contentType
        set.headers['Cache-Control'] = 'public, max-age=31536000'

        return fileBuffer
    })

