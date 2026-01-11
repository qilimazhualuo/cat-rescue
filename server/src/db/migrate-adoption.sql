-- 创建领养申请表
CREATE TABLE IF NOT EXISTS adoption_applications (
  id SERIAL PRIMARY KEY,
  cat_id INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  applicant_name VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  applicant_id_card VARCHAR(18),
  applicant_address VARCHAR(255),
  applicant_location VARCHAR(100),
  applicant_email VARCHAR(100),
  application_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed
  notes TEXT,
  approved_by INTEGER REFERENCES persons(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_adoption_applications_cat_id ON adoption_applications(cat_id);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_status ON adoption_applications(status);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_created_at ON adoption_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_applicant_phone ON adoption_applications(applicant_phone);

-- 创建更新时间触发器
CREATE TRIGGER update_adoption_applications_updated_at BEFORE UPDATE ON adoption_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 迁移现有领养数据到新表（如果有的话）
INSERT INTO adoption_applications (
  cat_id, 
  applicant_name, 
  applicant_phone, 
  applicant_address, 
  applicant_location,
  status,
  created_at
)
SELECT 
  id,
  adopter_name,
  adopter_phone,
  adopter_address,
  adopter_location,
  CASE 
    WHEN adoption_status = '已领养' THEN 'completed'
    WHEN adoption_status = '审核中' THEN 'approved'
    ELSE 'pending'
  END,
  updated_at
FROM cats
WHERE adopter_name IS NOT NULL AND adopter_name != ''
ON CONFLICT DO NOTHING;

-- 移除 cats 表中的领养人相关字段（保留 adoption_status 用于快速查询）
-- 注意：这里不删除字段，而是通过迁移脚本逐步处理
-- ALTER TABLE cats DROP COLUMN IF EXISTS adopter_name;
-- ALTER TABLE cats DROP COLUMN IF EXISTS adopter_phone;
-- ALTER TABLE cats DROP COLUMN IF EXISTS adopter_address;
-- ALTER TABLE cats DROP COLUMN IF EXISTS adopter_location;

