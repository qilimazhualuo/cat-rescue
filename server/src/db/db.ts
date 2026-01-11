import { Pool, QueryResult } from "pg";
import pool from "./pool";
import config from "@/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// 初始化数据库连接和表结构
export async function initDb() {
    try {
        // 先检查数据库是否存在，如果不存在则创建
        const dbName = config.database.database;
        const adminPool = new Pool({
            user: config.database.user,
            host: config.database.host,
            database: "postgres", // 连接到默认数据库
            password: config.database.password,
            port: config.database.port,
        });

        try {
            // 检查数据库是否存在
            const result = await adminPool.query(
                "SELECT 1 FROM pg_database WHERE datname = $1",
                [dbName]
            );

            if (result.rows.length === 0) {
                // 数据库不存在，创建它
                console.log(`数据库 ${dbName} 不存在，正在创建...`);
                await adminPool.query(`CREATE DATABASE ${dbName}`);
                console.log(`数据库 ${dbName} 创建成功`);
            } else {
                console.log(`数据库 ${dbName} 已存在`);
            }
        } finally {
            await adminPool.end();
        }

        // 测试目标数据库连接
        await pool.query("SELECT 1");
        console.log("数据库连接成功");

        // 读取并执行初始化 SQL
        // 使用 import.meta.url 获取当前文件路径（适用于 ES modules）
        // 如果使用 CommonJS，可以使用 __dirname
        let initSqlPath: string;
        try {
            // 尝试使用 __dirname（CommonJS）
            initSqlPath = join(__dirname, "init-db.sql");
        } catch {
            // 如果 __dirname 不存在，使用相对路径
            initSqlPath = join(process.cwd(), "server", "src", "db", "init-db.sql");
        }

        const initSql = readFileSync(initSqlPath, "utf-8");

        // 移除注释行（以 -- 开头的行）
        const cleanSql = initSql
            .split("\n")
            .map((line) => {
                // 移除行内注释（保留 SQL 语句中的注释部分）
                const commentIndex = line.indexOf("--");
                if (commentIndex >= 0) {
                    // 检查是否在字符串中
                    const beforeComment = line.substring(0, commentIndex);
                    const quoteCount = (beforeComment.match(/'/g) || []).length;
                    if (quoteCount % 2 === 0) {
                        // 不在字符串中，移除注释
                        return line.substring(0, commentIndex).trim();
                    }
                }
                return line.trim();
            })
            .filter((line) => line.length > 0)
            .join("\n");

        // 智能分割 SQL 语句，正确处理美元引号和字符串
        const statements: string[] = [];
        let currentStatement = "";
        let inDollarQuote = false;
        let dollarTag = "";
        let inSingleQuote = false;
        let i = 0;

        while (i < cleanSql.length) {
            const char = cleanSql[i];
            const nextChar = i + 1 < cleanSql.length ? cleanSql[i + 1] : "";

            // 检查美元引号（PostgreSQL 的 $$ 或 $tag$ 格式）
            if (char === "$" && !inSingleQuote) {
                // 尝试匹配美元引号标签
                let dollarTagMatch: string | null = null;
                
                if (nextChar === "$") {
                    // 空标签 $$
                    dollarTagMatch = "$$";
                } else {
                    // 带标签的 $tag$，查找下一个 $
                    const tagEnd = cleanSql.indexOf("$", i + 1);
                    if (tagEnd > i) {
                        dollarTagMatch = cleanSql.substring(i, tagEnd + 1);
                    }
                }

                if (dollarTagMatch) {
                    if (!inDollarQuote) {
                        // 开始美元引号
                        inDollarQuote = true;
                        dollarTag = dollarTagMatch;
                        currentStatement += dollarTagMatch;
                        i += dollarTagMatch.length;
                        continue;
                    } else if (dollarTagMatch === dollarTag) {
                        // 结束美元引号
                        inDollarQuote = false;
                        dollarTag = "";
                        currentStatement += dollarTagMatch;
                        i += dollarTagMatch.length;
                        continue;
                    }
                }
            }

            // 检查单引号（字符串），但不在美元引号内
            if (char === "'" && !inDollarQuote) {
                // 处理转义的单引号 ''
                if (nextChar === "'") {
                    currentStatement += "''";
                    i += 2;
                    continue;
                }
                inSingleQuote = !inSingleQuote;
            }

            currentStatement += char;

            // 检查语句结束（分号），但不在引号内
            if (char === ";" && !inDollarQuote && !inSingleQuote) {
                const trimmed = currentStatement.trim();
                if (trimmed.length > 0) {
                    statements.push(trimmed);
                }
                currentStatement = "";
            }

            i++;
        }

        // 添加最后一个语句（如果有）
        const lastTrimmed = currentStatement.trim();
        if (lastTrimmed.length > 0) {
            statements.push(lastTrimmed);
        }

        for (const statement of statements) {
            try {
                await pool.query(statement);
            } catch (error: any) {
                // 忽略已存在的表/索引/函数等错误（这些是正常的）
                const errorMsg = error.message.toLowerCase();
                if (
                    errorMsg.includes("already exists") ||
                    errorMsg.includes("duplicate") ||
                    errorMsg.includes("does not exist")
                ) {
                    // 这些错误可以忽略，继续执行
                    continue;
                } else {
                    console.warn("执行 SQL 语句时出现警告:", error.message);
                    // 对于其他错误，记录但不中断
                }
            }
        }

        console.log("数据库表结构初始化完成");
    } catch (error) {
        console.error("数据库初始化失败:", error);
        throw error;
    }
}

// 获取所有数据（不包含图片二进制数据）
export async function getAllCats(): Promise<Cat[]> {
    const result = await pool.query(`
    SELECT 
      id, category, name, gender, age_months, is_vaccinated, vaccination_proof,
      is_dewormed, is_neutered, photo, rescuer_name, phone, rescue_date,
      rescue_location, rescue_process, is_placed, adoption_location, current_status,
      adoption_status, created_at, updated_at, unit_id,
      CASE WHEN photo_data IS NOT NULL THEN '/api/cats/' || id || '/photo' ELSE photo END as photo_url,
      CASE WHEN vaccination_proof_data IS NOT NULL THEN '/api/cats/' || id || '/vaccination_proof' ELSE vaccination_proof END as vaccination_proof_url
    FROM cats 
    ORDER BY created_at DESC
  `);
    return result.rows.map((row) => mapRowToCat(row));
}

// 根据ID获取（不包含图片二进制数据）
export async function getCatById(id: number): Promise<Cat | undefined> {
    const result = await pool.query(
        `
    SELECT 
      id, category, name, gender, age_months, is_vaccinated, vaccination_proof,
      is_dewormed, is_neutered, photo, rescuer_name, phone, rescue_date,
      rescue_location, rescue_process, is_placed, adoption_location, current_status,
      adoption_status, created_at, updated_at, unit_id,
      CASE WHEN photo_data IS NOT NULL THEN '/api/cats/' || id || '/photo' ELSE photo END as photo_url,
      CASE WHEN vaccination_proof_data IS NOT NULL THEN '/api/cats/' || id || '/vaccination_proof' ELSE vaccination_proof END as vaccination_proof_url
    FROM cats 
    WHERE id = $1
  `,
        [id]
    );
    if (result.rows.length === 0) {
        return undefined;
    }
    return mapRowToCat(result.rows[0]);
}

// 创建
export async function createCat(
    cat: Omit<Cat, "id" | "created_at" | "updated_at"> & {
        photo_data?: Buffer;
        photo_mime_type?: string;
        vaccination_proof_data?: Buffer;
        vaccination_proof_mime_type?: string;
    }
): Promise<Cat> {
    const result = await pool.query(
        `
    INSERT INTO cats (
      category, name, gender, age_months, is_vaccinated, vaccination_proof,
      is_dewormed, is_neutered, photo, rescuer_name, phone, rescue_date,
      rescue_location, rescue_process, is_placed, adoption_location, current_status,
      adoption_status, photo_data, photo_mime_type, vaccination_proof_data, vaccination_proof_mime_type, unit_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
    ) RETURNING id
  `,
        [
            cat.category,
            cat.name,
            cat.gender,
            cat.age_months,
            cat.is_vaccinated,
            cat.vaccination_proof || null,
            cat.is_dewormed,
            cat.is_neutered,
            cat.photo || null,
            cat.rescuer_name,
            cat.phone,
            cat.rescue_date,
            cat.rescue_location,
            cat.rescue_process,
            cat.is_placed,
            cat.adoption_location || null,
            cat.current_status || null,
            cat.adoption_status || null,
            cat.photo_data || null,
            cat.photo_mime_type || null,
            cat.vaccination_proof_data || null,
            cat.vaccination_proof_mime_type || null,
            cat.unit_id || null,
        ]
    );

    // 获取完整数据（包含生成的 URL）
    const newId = result.rows[0].id;
    const createdCat = await getCatById(newId);
    if (!createdCat) {
        throw new Error("创建猫咪后无法获取数据");
    }
    return createdCat;
}

// 更新
export async function updateCat(
    id: number,
    updates: Partial<Omit<Cat, "id" | "created_at">> & {
        photo_data?: Buffer;
        photo_mime_type?: string;
        vaccination_proof_data?: Buffer;
        vaccination_proof_mime_type?: string;
    }
): Promise<Cat | null> {
    // 构建动态更新语句
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
        "category",
        "name",
        "gender",
        "age_months",
        "is_vaccinated",
        "vaccination_proof",
        "is_dewormed",
        "is_neutered",
        "photo",
        "rescuer_name",
        "phone",
        "rescue_date",
        "rescue_location",
        "rescue_process",
        "is_placed",
        "adoption_location",
        "current_status",
        "adoption_status",
        "photo_data",
        "photo_mime_type",
        "vaccination_proof_data",
        "vaccination_proof_mime_type",
        "unit_id",
    ];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (fields.length === 0) {
        return (await getCatById(id)) || null;
    }

    values.push(id);
    const query = `UPDATE cats SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING id`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    // 获取完整数据（包含生成的 URL）
    const updatedCat = await getCatById(id);
    return updatedCat || null;
}

// 删除
export async function deleteCat(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM cats WHERE id = $1", [id]);
    return result.rowCount !== null && result.rowCount > 0;
}

// 搜索和筛选
export async function searchCats(options: {
    category?: string;
    adoption_status?: string;
    search?: string;
    unit_id?: number;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: Cat[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    let whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (options.category) {
        whereConditions.push(`category = $${paramIndex}`);
        queryParams.push(options.category);
        paramIndex++;
    }

    if (options.adoption_status) {
        whereConditions.push(
            `COALESCE(adoption_status, '未领养') = $${paramIndex}`
        );
        queryParams.push(options.adoption_status);
        paramIndex++;
    }

    if (options.search) {
        whereConditions.push(`(
      LOWER(name) LIKE $${paramIndex} OR
      LOWER(rescuer_name) LIKE $${paramIndex} OR
      phone LIKE $${paramIndex}
    )`);
        queryParams.push(`%${options.search.toLowerCase()}%`);
        paramIndex++;
    }

    // 根据单位过滤（如果指定了 unit_id）
    if (options.unit_id !== undefined) {
        whereConditions.push(`unit_id = $${paramIndex}`);
        queryParams.push(options.unit_id);
        paramIndex++;
    }

    const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 获取总数
    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM cats ${whereClause}`,
        queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // 分页查询
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    queryParams.push(pageSize);
    queryParams.push(offset);

    const dataResult = await pool.query(
        `SELECT 
      id, category, name, gender, age_months, is_vaccinated, vaccination_proof,
      is_dewormed, is_neutered, photo, rescuer_name, phone, rescue_date,
      rescue_location, rescue_process, is_placed, adoption_location, current_status,
      adoption_status, created_at, updated_at, unit_id,
      CASE WHEN photo_data IS NOT NULL THEN '/api/cats/' || id || '/photo' ELSE photo END as photo_url,
      CASE WHEN vaccination_proof_data IS NOT NULL THEN '/api/cats/' || id || '/vaccination_proof' ELSE vaccination_proof END as vaccination_proof_url
    FROM cats 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
    );

    return {
        data: dataResult.rows.map((row) => mapRowToCat(row)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

// 获取猫咪的图片（从 cats 表读取）
export async function getCatPhoto(
    catId: number,
    type: "photo" | "vaccination_proof"
): Promise<{ data: Buffer; mimeType: string } | null> {
    const field = type === "photo" ? "photo_data" : "vaccination_proof_data";
    const mimeField =
        type === "photo" ? "photo_mime_type" : "vaccination_proof_mime_type";

    const result = await pool.query(
        `SELECT ${field} as data, ${mimeField} as mime_type FROM cats WHERE id = $1`,
        [catId]
    );

    if (result.rows.length === 0 || !result.rows[0].data) {
        return null;
    }

    return {
        data: result.rows[0].data,
        mimeType: result.rows[0].mime_type || "image/jpeg",
    };
}

// 将数据库行映射为 Cat 对象
function mapRowToCat(row: any): Cat {
    return {
        id: row.id,
        category: row.category,
        name: row.name,
        gender: row.gender,
        age_months: row.age_months,
        is_vaccinated: row.is_vaccinated,
        vaccination_proof: row.vaccination_proof_url || row.vaccination_proof,
        is_dewormed: row.is_dewormed,
        is_neutered: row.is_neutered,
        photo: row.photo_url || row.photo,
        rescuer_name: row.rescuer_name,
        phone: row.phone,
        rescue_date: row.rescue_date
            ? new Date(row.rescue_date).toISOString().split("T")[0]
            : "",
        rescue_location: row.rescue_location,
        rescue_process: row.rescue_process,
        is_placed: row.is_placed,
        adoption_location: row.adoption_location,
        current_status: row.current_status,
        adoption_status: row.adoption_status,
        unit_id: row.unit_id,
        created_at: row.created_at
            ? new Date(row.created_at).toISOString()
            : undefined,
        updated_at: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : undefined,
    };
}

export interface Cat {
    id?: number;
    category: string;
    name: string;
    gender: string;
    age_months: number;
    is_vaccinated: number;
    vaccination_proof?: string;
    photo?: string;
    is_dewormed: number;
    is_neutered: number;
    rescuer_name: string;
    phone: string;
    rescue_date: string;
    rescue_location: string;
    rescue_process: string;
    is_placed: number;
    adoption_location?: string;
    current_status?: string;
    adoption_status?: string; // 保留用于快速查询：未领养、审核中、已领养
    unit_id?: number;
    created_at?: string;
    updated_at?: string;
}

// 领养申请接口
export interface AdoptionApplication {
    id?: number;
    cat_id: number;
    applicant_name: string;
    applicant_phone: string;
    applicant_id_card?: string;
    applicant_address?: string;
    applicant_location?: string;
    applicant_email?: string;
    application_reason?: string;
    status: "pending" | "approved" | "rejected" | "completed";
    notes?: string;
    approved_by?: number;
    approved_at?: string;
    created_at?: string;
    updated_at?: string;
}

// ==================== 单位管理相关函数 ====================

// 获取所有单位
export async function getAllUnits(): Promise<Unit[]> {
    const result = await pool.query(
        "SELECT * FROM units ORDER BY created_at DESC"
    );
    return result.rows.map((row) => mapRowToUnit(row));
}

// 根据ID获取单位
export async function getUnitById(id: number): Promise<Unit | undefined> {
    const result = await pool.query("SELECT * FROM units WHERE id = $1", [id]);
    if (result.rows.length === 0) {
        return undefined;
    }
    return mapRowToUnit(result.rows[0]);
}

// 创建单位
export async function createUnit(
    unit: Omit<Unit, "id" | "created_at" | "updated_at">
): Promise<Unit> {
    const result = await pool.query(
        `
    INSERT INTO units (
      name, code, address, location, contact_person, phone, email, description, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    ) RETURNING *
  `,
        [
            unit.name,
            unit.code || null,
            unit.address || null,
            unit.location || null,
            unit.contact_person || null,
            unit.phone || null,
            unit.email || null,
            unit.description || null,
            unit.status || "active",
        ]
    );
    return mapRowToUnit(result.rows[0]);
}

// 更新单位
export async function updateUnit(
    id: number,
    updates: Partial<Omit<Unit, "id" | "created_at">>
): Promise<Unit | null> {
    // 构建动态更新语句
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
        "name",
        "code",
        "address",
        "location",
        "contact_person",
        "phone",
        "email",
        "description",
        "status",
    ];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (fields.length === 0) {
        return (await getUnitById(id)) || null;
    }

    values.push(id);
    const query = `UPDATE units SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    return mapRowToUnit(result.rows[0]);
}

// 删除单位
export async function deleteUnit(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM units WHERE id = $1", [id]);
    return result.rowCount !== null && result.rowCount > 0;
}

// 搜索和筛选单位
export async function searchUnits(options: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: Unit[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    let whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (options.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(options.status);
        paramIndex++;
    }

    if (options.search) {
        whereConditions.push(`(
      LOWER(name) LIKE $${paramIndex} OR
      LOWER(code) LIKE $${paramIndex} OR
      LOWER(contact_person) LIKE $${paramIndex} OR
      phone LIKE $${paramIndex}
    )`);
        queryParams.push(`%${options.search.toLowerCase()}%`);
        paramIndex++;
    }

    const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 获取总数
    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM units ${whereClause}`,
        queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // 分页查询
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    queryParams.push(pageSize);
    queryParams.push(offset);

    const dataResult = await pool.query(
        `SELECT * FROM units ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
    );

    return {
        data: dataResult.rows.map((row) => mapRowToUnit(row)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

// 将数据库行映射为 Unit 对象
function mapRowToUnit(row: any): Unit {
    return {
        id: row.id,
        name: row.name,
        code: row.code,
        address: row.address,
        location: row.location || undefined,
        contact_person: row.contact_person,
        phone: row.phone,
        email: row.email,
        description: row.description,
        status: row.status,
        created_at: row.created_at
            ? new Date(row.created_at).toISOString()
            : undefined,
        updated_at: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : undefined,
    };
}

export interface Unit {
    id?: number;
    name: string;
    code?: string;
    address?: string;
    location?: string; // 位置坐标，格式：纬度,经度
    contact_person?: string;
    phone?: string;
    email?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

// ==================== 人员管理相关函数 ====================

// 获取所有人员
export async function getAllPersons(): Promise<Person[]> {
    const result = await pool.query(`
    SELECT p.*, u.name as unit_name, r.id as role_id, r.name as role_name
    FROM persons p 
    LEFT JOIN units u ON p.unit_id = u.id 
    LEFT JOIN roles r ON p.role_id = r.id
    ORDER BY p.created_at DESC
  `);
    return result.rows.map((row) => mapRowToPerson(row));
}

// 根据ID获取人员
export async function getPersonById(id: number): Promise<Person | undefined> {
    const result = await pool.query(
        `
    SELECT p.*, u.name as unit_name, r.id as role_id, r.name as role_name
    FROM persons p 
    LEFT JOIN units u ON p.unit_id = u.id 
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.id = $1
  `,
        [id]
    );
    if (result.rows.length === 0) {
        return undefined;
    }
    return mapRowToPerson(result.rows[0]);
}

// 创建人员
export async function createPerson(
    person: Omit<Person, "id" | "created_at" | "updated_at" | "unit_name">
): Promise<Person> {
    const result = await pool.query(
        `
    INSERT INTO persons (
      name, id_card, phone, email, gender, birth_date, address, 
      unit_id, position, status, notes, username, password, role, role_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    ) RETURNING *
  `,
        [
            person.name,
            person.id_card || null,
            person.phone || null,
            person.email || null,
            person.gender || null,
            person.birth_date || null,
            person.address || null,
            person.unit_id || null,
            person.position || null,
            person.status || "active",
            person.notes || null,
            person.username || null,
            person.password || null,
            person.role || "user",
            person.role_id || null,
        ]
    );

    // 获取完整数据（包含单位名称）
    const createdPerson = await getPersonById(result.rows[0].id);
    if (!createdPerson) {
        throw new Error("创建人员后无法获取数据");
    }
    return createdPerson;
}

// 更新人员
export async function updatePerson(
    id: number,
    updates: Partial<
        Omit<Person, "id" | "created_at" | "updated_at" | "unit_name">
    >
): Promise<Person | null> {
    // 构建动态更新语句
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
        "name",
        "id_card",
        "phone",
        "email",
        "gender",
        "birth_date",
        "address",
        "unit_id",
        "position",
        "status",
        "notes",
        "username",
        "password",
        "role",
        "role_id",
    ];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (fields.length === 0) {
        return (await getPersonById(id)) || null;
    }

    values.push(id);
    const query = `UPDATE persons SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    // 获取完整数据（包含单位名称）
    const updatedPerson = await getPersonById(id);
    return updatedPerson || null;
}

// 删除人员
export async function deletePerson(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM persons WHERE id = $1", [id]);
    return result.rowCount !== null && result.rowCount > 0;
}

// 搜索和筛选人员
export async function searchPersons(options: {
    search?: string;
    status?: string;
    unit_id?: number;
    gender?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: Person[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    let whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (options.status) {
        whereConditions.push(`p.status = $${paramIndex}`);
        queryParams.push(options.status);
        paramIndex++;
    }

    if (options.unit_id) {
        whereConditions.push(`p.unit_id = $${paramIndex}`);
        queryParams.push(options.unit_id);
        paramIndex++;
    }

    if (options.gender) {
        whereConditions.push(`p.gender = $${paramIndex}`);
        queryParams.push(options.gender);
        paramIndex++;
    }

    if (options.search) {
        whereConditions.push(`(
      LOWER(p.name) LIKE $${paramIndex} OR
      p.id_card LIKE $${paramIndex} OR
      p.phone LIKE $${paramIndex} OR
      LOWER(p.position) LIKE $${paramIndex}
    )`);
        queryParams.push(`%${options.search.toLowerCase()}%`);
        paramIndex++;
    }

    const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 获取总数
    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM persons p ${whereClause}`,
        queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // 分页查询
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    queryParams.push(pageSize);
    queryParams.push(offset);

    const dataResult = await pool.query(
        `SELECT p.*, u.name as unit_name, r.id as role_id, r.name as role_name
     FROM persons p 
     LEFT JOIN units u ON p.unit_id = u.id 
     LEFT JOIN roles r ON p.role_id = r.id
     ${whereClause} 
     ORDER BY p.created_at DESC 
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
    );

    return {
        data: dataResult.rows.map((row) => mapRowToPerson(row)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

// 将数据库行映射为 Person 对象
function mapRowToPerson(row: any): Person {
    return {
        id: row.id,
        name: row.name,
        id_card: row.id_card,
        phone: row.phone,
        email: row.email,
        gender: row.gender,
        birth_date: row.birth_date
            ? new Date(row.birth_date).toISOString().split("T")[0]
            : undefined,
        address: row.address,
        unit_id: row.unit_id,
        unit_name: row.unit_name,
        position: row.position,
        status: row.status,
        notes: row.notes,
        username: row.username,
        password: row.password, // 包含密码字段（用于登录验证）
        role: row.role,
        role_id: row.role_id,
        role_name: row.role_name,
        last_login: row.last_login
            ? new Date(row.last_login).toISOString()
            : undefined,
        created_at: row.created_at
            ? new Date(row.created_at).toISOString()
            : undefined,
        updated_at: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : undefined,
    };
}

export interface Person {
    id?: number;
    name: string;
    id_card?: string;
    phone?: string;
    email?: string;
    gender?: string;
    birth_date?: string;
    address?: string;
    unit_id?: number;
    unit_name?: string;
    position?: string;
    status?: string;
    notes?: string;
    username?: string;
    password?: string;
    role?: string;
    role_id?: number;
    role_name?: string;
    last_login?: string;
    created_at?: string;
    updated_at?: string;
}

// ==================== 登录认证相关函数 ====================

// 根据用户名查找人员（用于登录）
export async function getPersonByUsername(
    username: string
): Promise<Person | undefined> {
    const result = await pool.query(
        `
    SELECT p.*, u.name as unit_name, r.id as role_id, r.name as role_name
    FROM persons p 
    LEFT JOIN units u ON p.unit_id = u.id 
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.username = $1
  `,
        [username]
    );
    if (result.rows.length === 0) {
        return undefined;
    }
    return mapRowToPerson(result.rows[0]);
}

// 更新最后登录时间
export async function updateLastLogin(id: number): Promise<void> {
    await pool.query(
        "UPDATE persons SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
    );
}

// 更新人员密码
export async function updatePersonPassword(
    id: number,
    hashedPassword: string
): Promise<boolean> {
    const result = await pool.query(
        "UPDATE persons SET password = $1 WHERE id = $2",
        [hashedPassword, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
}

// ==================== 角色管理相关函数 ====================

// 获取所有角色
export async function getAllRoles(): Promise<Role[]> {
    const result = await pool.query(
        "SELECT * FROM roles ORDER BY created_at DESC"
    );
    return result.rows.map((row) => mapRowToRole(row));
}

// 根据ID获取角色
export async function getRoleById(id: number): Promise<Role | undefined> {
    const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
    if (result.rows.length === 0) {
        return undefined;
    }
    const role = mapRowToRole(result.rows[0]);
    // 获取角色的页面权限
    role.pages = await getRolePages(id);
    return role;
}

// 创建角色
export async function createRole(
    role: Omit<Role, "id" | "created_at" | "updated_at" | "pages"> & {
        pages?: number[];
    }
): Promise<Role> {
    const result = await pool.query(
        `
    INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *
  `,
        [role.name, role.description || null]
    );

    const newRole = mapRowToRole(result.rows[0]);

    // 设置页面权限
    if (role.pages && role.pages.length > 0) {
        await setRolePages(newRole.id!, role.pages);
    }

    const createdRole = await getRoleById(newRole.id!);
    if (!createdRole) {
        throw new Error("创建角色后无法获取数据");
    }
    return createdRole;
}

// 更新角色
export async function updateRole(
    id: number,
    updates: Partial<Omit<Role, "id" | "created_at" | "updated_at" | "pages">> & {
        pages?: number[];
    }
): Promise<Role | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
    }

    if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
    }

    if (fields.length > 0) {
        values.push(id);
        const query = `UPDATE roles SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
        await pool.query(query, values);
    }

    // 更新页面权限
    if (updates.pages !== undefined) {
        await setRolePages(id, updates.pages);
    }

    return (await getRoleById(id)) || null;
}

// 删除角色
export async function deleteRole(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM roles WHERE id = $1", [id]);
    return result.rowCount !== null && result.rowCount > 0;
}

// 获取角色的页面权限
export async function getRolePages(roleId: number): Promise<number[]> {
    const result = await pool.query(
        "SELECT page_id FROM role_pages WHERE role_id = $1",
        [roleId]
    );
    return result.rows.map((row) => row.page_id);
}

// 设置角色的页面权限
export async function setRolePages(
    roleId: number,
    pageIds: number[]
): Promise<void> {
    // 删除现有权限
    await pool.query("DELETE FROM role_pages WHERE role_id = $1", [roleId]);

    // 添加新权限
    if (pageIds.length > 0) {
        const values = pageIds.map((_, index) => `($1, $${index + 2})`).join(", ");
        const params = [roleId, ...pageIds];
        await pool.query(
            `INSERT INTO role_pages (role_id, page_id) VALUES ${values}`,
            params
        );
    }
}

// 检查用户是否有权限访问页面
export async function checkPagePermission(
    roleId: number | null,
    pagePath: string
): Promise<boolean> {
    if (!roleId) {
        return false;
    }

    const result = await pool.query(
        `
    SELECT COUNT(*) as count
    FROM role_pages rp
    JOIN pages p ON rp.page_id = p.id
    WHERE rp.role_id = $1 AND p.path = $2
  `,
        [roleId, pagePath]
    );

    return parseInt(result.rows[0].count) > 0;
}

// 获取所有页面
export async function getAllPages(): Promise<Page[]> {
    const result = await pool.query("SELECT * FROM pages ORDER BY id");
    return result.rows.map((row) => ({
        id: row.id,
        path: row.path,
        name: row.name,
        description: row.description,
    }));
}

// 将数据库行映射为 Role 对象
function mapRowToRole(row: any): Role {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        created_at: row.created_at
            ? new Date(row.created_at).toISOString()
            : undefined,
        updated_at: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : undefined,
        pages: [],
    };
}

export interface Role {
    id?: number;
    name: string;
    description?: string;
    pages?: number[];
    created_at?: string;
    updated_at?: string;
}

export interface Page {
    id?: number;
    path: string;
    name: string;
    description?: string;
}

// ==================== 领养申请管理 ====================

// 映射数据库行到领养申请对象（提前定义，供其他函数使用）
function mapRowToAdoptionApplication(row: any): AdoptionApplication {
    return {
        id: row.id,
        cat_id: row.cat_id,
        applicant_name: row.applicant_name,
        applicant_phone: row.applicant_phone,
        applicant_id_card: row.applicant_id_card,
        applicant_address: row.applicant_address,
        applicant_location: row.applicant_location,
        applicant_email: row.applicant_email,
        application_reason: row.application_reason,
        status: row.status,
        notes: row.notes,
        approved_by: row.approved_by,
        approved_at: row.approved_at
            ? new Date(row.approved_at).toISOString()
            : undefined,
        created_at: row.created_at
            ? new Date(row.created_at).toISOString()
            : undefined,
        updated_at: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : undefined,
    };
}

// 获取猫咪的所有领养申请
export async function getAdoptionApplicationsByCatId(
    catId: number
): Promise<AdoptionApplication[]> {
    const result = await pool.query(
        `
    SELECT 
      id, cat_id, applicant_name, applicant_phone, applicant_id_card,
      applicant_address, applicant_location, applicant_email, application_reason,
      status, notes, approved_by, approved_at, created_at, updated_at
    FROM adoption_applications
    WHERE cat_id = $1
    ORDER BY created_at DESC
  `,
        [catId]
    );

    return result.rows.map((row) => mapRowToAdoptionApplication(row));
}

// 获取单个领养申请
export async function getAdoptionApplicationById(
    id: number
): Promise<AdoptionApplication | undefined> {
    const result = await pool.query(
        `
    SELECT 
      id, cat_id, applicant_name, applicant_phone, applicant_id_card,
      applicant_address, applicant_location, applicant_email, application_reason,
      status, notes, approved_by, approved_at, created_at, updated_at
    FROM adoption_applications
    WHERE id = $1
  `,
        [id]
    );

    if (result.rows.length === 0) {
        return undefined;
    }

    return mapRowToAdoptionApplication(result.rows[0]);
}

// 创建领养申请
export async function createAdoptionApplication(
    application: Omit<AdoptionApplication, "id" | "created_at" | "updated_at">
): Promise<AdoptionApplication> {
    const result = await pool.query(
        `
    INSERT INTO adoption_applications (
      cat_id, applicant_name, applicant_phone, applicant_id_card,
      applicant_address, applicant_location, applicant_email, application_reason,
      status, notes, approved_by, approved_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, cat_id, applicant_name, applicant_phone, applicant_id_card,
      applicant_address, applicant_location, applicant_email, application_reason,
      status, notes, approved_by, approved_at, created_at, updated_at
  `,
        [
            application.cat_id,
            application.applicant_name,
            application.applicant_phone,
            application.applicant_id_card || null,
            application.applicant_address || null,
            application.applicant_location || null,
            application.applicant_email || null,
            application.application_reason || null,
            application.status || "pending",
            application.notes || null,
            application.approved_by || null,
            application.approved_at || null,
        ]
    );

    return mapRowToAdoptionApplication(result.rows[0]);
}

// 更新领养申请
export async function updateAdoptionApplication(
    id: number,
    updates: Partial<AdoptionApplication>
): Promise<AdoptionApplication | undefined> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.applicant_name !== undefined) {
        updateFields.push(`applicant_name = $${paramIndex}`);
        updateValues.push(updates.applicant_name);
        paramIndex++;
    }
    if (updates.applicant_phone !== undefined) {
        updateFields.push(`applicant_phone = $${paramIndex}`);
        updateValues.push(updates.applicant_phone);
        paramIndex++;
    }
    if (updates.applicant_id_card !== undefined) {
        updateFields.push(`applicant_id_card = $${paramIndex}`);
        updateValues.push(updates.applicant_id_card || null);
        paramIndex++;
    }
    if (updates.applicant_address !== undefined) {
        updateFields.push(`applicant_address = $${paramIndex}`);
        updateValues.push(updates.applicant_address || null);
        paramIndex++;
    }
    if (updates.applicant_location !== undefined) {
        updateFields.push(`applicant_location = $${paramIndex}`);
        updateValues.push(updates.applicant_location || null);
        paramIndex++;
    }
    if (updates.applicant_email !== undefined) {
        updateFields.push(`applicant_email = $${paramIndex}`);
        updateValues.push(updates.applicant_email || null);
        paramIndex++;
    }
    if (updates.application_reason !== undefined) {
        updateFields.push(`application_reason = $${paramIndex}`);
        updateValues.push(updates.application_reason || null);
        paramIndex++;
    }
    if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(updates.status);
        paramIndex++;
    }
    if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        updateValues.push(updates.notes || null);
        paramIndex++;
    }
    if (updates.approved_by !== undefined) {
        updateFields.push(`approved_by = $${paramIndex}`);
        updateValues.push(updates.approved_by || null);
        paramIndex++;
    }
    if (updates.approved_at !== undefined) {
        updateFields.push(`approved_at = $${paramIndex}`);
        updateValues.push(updates.approved_at || null);
        paramIndex++;
    }

    if (updateFields.length === 0) {
        return await getAdoptionApplicationById(id);
    }

    updateValues.push(id);

    const result = await pool.query(
        `
    UPDATE adoption_applications
    SET ${updateFields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING id, cat_id, applicant_name, applicant_phone, applicant_id_card,
      applicant_address, applicant_location, applicant_email, application_reason,
      status, notes, approved_by, approved_at, created_at, updated_at
  `,
        updateValues
    );

    if (result.rows.length === 0) {
        return undefined;
    }

    return mapRowToAdoptionApplication(result.rows[0]);
}

// 删除领养申请
export async function deleteAdoptionApplication(id: number): Promise<boolean> {
    const result = await pool.query(
        "DELETE FROM adoption_applications WHERE id = $1",
        [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
}

// 搜索领养申请
export async function searchAdoptionApplications(options: {
    cat_id?: number;
    status?: string;
    applicant_name?: string;
    applicant_phone?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: AdoptionApplication[];
    total: number;
    totalPages: number;
}> {
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (options.cat_id) {
        whereConditions.push(`cat_id = $${paramIndex}`);
        queryParams.push(options.cat_id);
        paramIndex++;
    }

    if (options.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(options.status);
        paramIndex++;
    }

    if (options.applicant_name) {
        whereConditions.push(`LOWER(applicant_name) LIKE $${paramIndex}`);
        queryParams.push(`%${options.applicant_name.toLowerCase()}%`);
        paramIndex++;
    }

    if (options.applicant_phone) {
        whereConditions.push(`applicant_phone LIKE $${paramIndex}`);
        queryParams.push(`%${options.applicant_phone}%`);
        paramIndex++;
    }

    const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 获取总数
    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM adoption_applications ${whereClause}`,
        queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // 分页查询
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    queryParams.push(pageSize);
    queryParams.push(offset);

    const dataResult = await pool.query(
        `SELECT 
            id, cat_id, applicant_name, applicant_phone, applicant_id_card,
            applicant_address, applicant_location, applicant_email, application_reason,
            status, notes, approved_by, approved_at, created_at, updated_at
        FROM adoption_applications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            queryParams
    );

    return {
        data: dataResult.rows.map((row) => mapRowToAdoptionApplication(row)),
        total,
        totalPages: Math.ceil(total / pageSize),
    };
}
