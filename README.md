# 猫咪救助信息管理系统

这是一个基于 Nuxt 3 的猫咪救助信息管理系统，使用 SQLite 数据库存储数据。

## 功能特性

- ✅ 完整的 CRUD 操作（创建、读取、更新、删除）
- ✅ 表单验证（救助过程 20-200 字限制）
- ✅ 搜索和筛选功能
- ✅ 分页显示
- ✅ 响应式设计
- ✅ SQLite 数据库存储

## 字段说明

### 基本信息
- 宠物类别（猫/狗/其他）
- 宠物名称
- 性别（公/母/未知）
- 年龄（月）

### 健康信息
- 是否免疫
- 免疫证明
- 是否驱虫
- 是否绝育
- 宠物照片（URL）

### 救助信息
- 救助人姓名
- 手机号
- 救助日期
- 救助地点
- 救助过程（20-200字，必填）

### 安置信息
- 宠物是否安置
- 领养地点
- 宠物现状

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 运行。

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

应用将在 `http://localhost:25783` 运行。

### 5. 启动生产服务器

打包完成后，可以使用以下方式启动：

**方式1：使用 npm 脚本（推荐）**
```bash
npm run start
```

**方式2：直接运行 Node.js**
```bash
node .output/server/index.mjs
```

**方式3：使用环境变量设置端口**
```bash
PORT=25783 node .output/server/index.mjs
```

生产服务器将在 `http://localhost:25783` 运行（或使用环境变量 PORT 指定的端口）。

### 6. 使用 PM2 启动（推荐生产环境）

**安装 PM2（如果未安装）**
```bash
npm install -g pm2
# 或
pnpm add -g pm2
```

**启动应用**
```bash
# 方式1：使用配置文件（推荐）
pm2 start ecosystem.config.js

# 方式2：直接启动
pm2 start .output/server/index.mjs --name cat-rescue --env PORT=25783

# 方式3：使用 npm 脚本（如果已配置）
pm2 start npm --name cat-rescue -- start
```

**常用 PM2 命令**
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs cat-rescue

# 停止应用
pm2 stop cat-rescue

# 重启应用
pm2 restart cat-rescue

# 删除应用
pm2 delete cat-rescue

# 保存当前进程列表（开机自启）
pm2 save

# 设置开机自启
pm2 startup
```

**PM2 配置文件**
项目已包含 `ecosystem.config.js` 配置文件，可以直接使用：
```bash
pm2 start ecosystem.config.js
```

## 数据库

数据库文件会自动创建在 `./data/cats.db`（可在 `nuxt.config.ts` 中配置）。

首次运行时会自动创建表结构。

## 项目结构

```
cat-rescue/
├── assets/          # 静态资源
├── pages/           # 页面路由
│   ├── index.vue    # 列表页
│   └── cats/        # 猫咪相关页面
│       ├── new.vue  # 添加页面
│       ├── [id].vue # 详情页
│       └── [id]/edit.vue # 编辑页
├── server/          # 服务端代码
│   ├── api/         # API 路由
│   └── utils/       # 工具函数（数据库）
└── nuxt.config.ts   # Nuxt 配置
```

## API 接口

### GET /api/cats
获取猫咪列表
- 查询参数：
  - `page`: 页码（默认 1）
  - `pageSize`: 每页数量（默认 20）
  - `search`: 搜索关键词
  - `category`: 类别筛选
  - `is_placed`: 安置状态筛选

### GET /api/cats/:id
获取单个猫咪信息

### POST /api/cats
创建新猫咪信息

### PUT /api/cats/:id
更新猫咪信息

### DELETE /api/cats/:id
删除猫咪信息

## 技术栈

- **Nuxt 3**: Vue.js 全栈框架
- **SQLite**: 轻量级数据库（better-sqlite3）
- **Tailwind CSS**: 实用优先的 CSS 框架

## 注意事项

1. 数据库文件会自动创建，无需手动初始化
2. 救助过程描述必须在 20-200 字之间
3. 照片字段支持 URL 格式，可以链接到外部图片
4. 所有必填字段都有前端和后端验证

## 开发说明

- 修改数据库路径：在 `nuxt.config.ts` 中设置 `runtimeConfig.dbPath`
- 添加新字段：需要同时修改数据库表结构（`server/utils/db.ts`）和前端表单
- 自定义样式：修改 `assets/css/main.css` 或使用 Tailwind 类

## 许可证

MIT

