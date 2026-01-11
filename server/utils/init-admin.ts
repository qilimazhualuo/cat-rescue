import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

/**
 * 初始化默认管理员账户
 * 默认用户名: admin
 * 默认密码: admin123
 * 
 * 使用方法：
 * 1. 在数据库创建后运行此脚本
 * 2. 或通过 API 调用: POST /api/admin/init
 */
export async function initAdminAccount() {
    const config = useRuntimeConfig()
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
    })

    try {
        // 检查管理员角色是否存在
        const roleResult = await pool.query(
            "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
        )

        if (roleResult.rows.length === 0) {
            throw new Error('管理员角色不存在，请先运行数据库初始化脚本')
        }

        const adminRoleId = roleResult.rows[0].id

        // 检查管理员账户是否已存在
        const userResult = await pool.query(
            "SELECT id FROM persons WHERE username = 'admin' LIMIT 1"
        )

        if (userResult.rows.length > 0) {
            console.log('管理员账户已存在，跳过创建')
            return {
                success: true,
                message: '管理员账户已存在',
                username: 'admin',
            }
        }

        // 生成密码哈希（默认密码: admin123）
        const defaultPassword = 'admin123'
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)

        // 创建管理员账户
        const insertResult = await pool.query(
            `INSERT INTO persons (
                name, username, password, role, role_id, status
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username`,
            ['系统管理员', 'admin', hashedPassword, 'admin', adminRoleId, 'active']
        )

        const admin = insertResult.rows[0]

        console.log('默认管理员账户创建成功')
        console.log('用户名: admin')
        console.log('密码: admin123')
        console.log('⚠️  请登录后立即修改密码！')

        return {
            success: true,
            message: '管理员账户创建成功',
            username: 'admin',
            password: 'admin123',
            warning: '请登录后立即修改密码！',
        }
    } catch (error) {
        console.error('创建管理员账户失败:', error)
        throw error
    } finally {
        await pool.end()
    }
}

