-- 创建 cats 表（图片直接存储在表中）
CREATE TABLE IF NOT EXISTS cats (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  age_months INTEGER NOT NULL DEFAULT 0,
  is_vaccinated INTEGER NOT NULL DEFAULT 0,
  vaccination_proof VARCHAR(255),
  is_dewormed INTEGER NOT NULL DEFAULT 0,
  is_neutered INTEGER NOT NULL DEFAULT 0,
  photo VARCHAR(255),
  rescuer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  rescue_date DATE NOT NULL,
  rescue_location VARCHAR(255) NOT NULL,
  rescue_process TEXT NOT NULL,
  is_placed INTEGER NOT NULL DEFAULT 0,
  adoption_location VARCHAR(255),
  current_status TEXT,
  adoption_status VARCHAR(20),
  adopter_name VARCHAR(100),
  adopter_phone VARCHAR(20),
  adopter_address VARCHAR(255),
  adopter_location VARCHAR(100),
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- 图片数据直接存储在表中
  photo_data BYTEA,
  photo_mime_type VARCHAR(50),
  vaccination_proof_data BYTEA,
  vaccination_proof_mime_type VARCHAR(50)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cats_category ON cats(category);
CREATE INDEX IF NOT EXISTS idx_cats_adoption_status ON cats(adoption_status);
CREATE INDEX IF NOT EXISTS idx_cats_created_at ON cats(created_at);
CREATE INDEX IF NOT EXISTS idx_cats_unit_id ON cats(unit_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cats_updated_at BEFORE UPDATE ON cats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 units 表（单位管理）
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50),
  address VARCHAR(255),
  location VARCHAR(100),
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_units_name ON units(name);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_created_at ON units(created_at);

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 persons 表（人员管理）
CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  id_card VARCHAR(18),
  phone VARCHAR(20),
  email VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  address VARCHAR(255),
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  position VARCHAR(100),
  notes TEXT,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_unit_id ON persons(unit_id);
CREATE INDEX IF NOT EXISTS idx_persons_created_at ON persons(created_at);
CREATE INDEX IF NOT EXISTS idx_persons_username ON persons(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_role_id ON persons(role_id);

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 roles 表（角色管理）
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 pages 表（页面权限）
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 role_pages 表（角色页面权限关联）
CREATE TABLE IF NOT EXISTS role_pages (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, page_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_pages_path ON pages(path);
CREATE INDEX IF NOT EXISTS idx_role_pages_role_id ON role_pages(role_id);
CREATE INDEX IF NOT EXISTS idx_role_pages_page_id ON role_pages(page_id);

-- 创建触发器
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认页面
INSERT INTO pages (path, name, description) VALUES
  ('/cats', '猫咪管理', '猫咪救助信息管理'),
  ('/units', '单位管理', '单位信息管理'),
  ('/persons', '人员管理', '人员信息管理'),
  ('/roles', '角色管理', '角色权限管理')
ON CONFLICT (path) DO NOTHING;

-- 插入默认角色
INSERT INTO roles (name, description) 
SELECT 'admin', '管理员，拥有所有权限'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

INSERT INTO roles (name, description) 
SELECT 'user', '普通用户，基础权限'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'user');

-- 为管理员角色分配所有页面权限
INSERT INTO role_pages (role_id, page_id)
SELECT r.id, p.id
FROM roles r, pages p
WHERE r.name = 'admin'
ON CONFLICT (role_id, page_id) DO NOTHING;

-- 注意：默认管理员账户需要通过以下方式创建：
-- 1. 运行 TypeScript 脚本: npx tsx server/utils/init-admin.ts
-- 2. 或调用 API: POST /api/admin/init
-- 默认管理员账户信息：
--   用户名: admin
--   密码: admin123
--   请登录后立即修改密码！

