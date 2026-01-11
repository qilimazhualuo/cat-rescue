# 前后端分离迁移说明

本项目已完成前后端分离，**保持原有接口定义、页面代码和数据库结构不变**。

## 项目结构

```
cat-rescue-separte/
├── app/              # 前端应用（Nuxt 3）- 保持原有代码不变
├── server/           # 后端服务（ElysiaJS + Bun）- 新实现
├── common/           # 共享代码（包含 map 相关功能）
└── package.json      # Workspace 配置
```

## 主要变更

### 1. 前端（app）
- **保持原有代码不变**，继续使用 `$fetch` 进行 API 调用
- 配置了 Vite 代理，将 `/api/*` 请求自动代理到后端服务
- 使用 `common/map` 替代原有的地图实现（可选）

### 2. 后端（server）
- 使用 `ElysiaJS` 框架替代 Nuxt Server API
- 使用 `Bun` 作为运行时
- **保持所有 API 路径和响应格式与原有一致**
- 端口：3000

### 3. 共享代码（common）
- 包含地图相关功能（从 yier 项目复制）
- 包含加密解密工具函数

## 配置说明

### 1. 安装依赖

```bash
# 在项目根目录
bun install
```

### 2. 环境变量

创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cat_rescue
DB_USER=postgres
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 密钥
JWT_SECRET=cat-rescue-secret-key-change-in-production

# API 基础 URL（前端代理使用）
API_BASE=http://localhost:3000
```

### 3. 启动服务

```bash
# 同时启动前端和后端
bun dev

# 或分别启动
bun dev:app      # 前端（端口 3000，通过代理访问后端）
bun dev:server   # 后端（端口 3001）
```

**注意**：前端和后端不能使用同一个端口。建议：
- 前端：3000
- 后端：3001

需要修改 `server/src/index.ts` 中的端口，并更新 `app/vite.config.ts` 中的代理配置。

## API 路由迁移状态

### 已完成
- ✅ `/api/auth/login` - 登录
- ✅ `/api/auth/logout` - 登出
- ✅ `/api/auth/me` - 获取当前用户
- ✅ `/api/auth/check-permission` - 检查权限

### 待实现（需要保持原有路径和格式）
- ⏳ `/api/cats/*` - 猫咪管理
- ⏳ `/api/persons/*` - 人员管理
- ⏳ `/api/units/*` - 单位管理
- ⏳ `/api/roles/*` - 角色管理
- ⏳ `/api/adoption-applications/*` - 领养申请
- ⏳ `/api/upload` - 文件上传
- ⏳ `/api/menu` - 菜单
- ⏳ `/api/pages` - 页面权限

## 工作原理

1. **前端请求**：前端使用 `$fetch('/api/xxx')` 调用 API
2. **Vite 代理**：Vite 开发服务器将 `/api/*` 请求代理到后端服务（`http://localhost:3001`）
3. **后端处理**：ElysiaJS 服务器处理请求，返回响应
4. **响应返回**：响应通过代理返回给前端

## 注意事项

1. **端口冲突**：确保前端和后端使用不同端口
2. **响应格式**：后端必须保持与原有 Nuxt Server API 相同的响应格式
3. **错误处理**：错误响应格式也需要保持一致
4. **数据库**：数据库结构完全不变，直接使用原有的 `db.ts` 文件

## 开发建议

1. 先启动后端服务，确保数据库连接正常
2. 再启动前端服务，通过代理访问后端
3. 逐步迁移剩余的 API 路由，保持原有格式
4. 测试每个接口，确保响应格式一致
