import { Elysia } from 'elysia'
import { auth } from '../auth'
import { getAllPages } from '../db/db'

export default new Elysia({ prefix: '/api/pages' })
    .use(auth)
    // GET /api/pages - 获取所有页面
    .get('/', async () => {
        const pages = await getAllPages()
        return pages
    })

