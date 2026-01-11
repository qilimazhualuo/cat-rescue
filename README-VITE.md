# Vite + Vue 3 前端迁移说明

前端已从 Nuxt 3 迁移到 Vite + Vue 3，**保持所有页面和组件代码不变**。

## 项目结构

```
app/
├── src/
│   ├── components/     # 组件（已迁移）
│   ├── views/          # 页面（已迁移，从 pages 目录）
│   ├── router/         # Vue Router 配置
│   ├── stores/         # Pinia 状态管理
│   ├── composables/    # 组合式函数
│   ├── utils/          # 工具函数（$fetch, navigateTo 等）
│   ├── assets/         # 静态资源
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── index.html          # HTML 模板
├── vite.config.ts      # Vite 配置
└── package.json        # 依赖配置
```

## 主要变更

### 1. 路由系统
- 从 Nuxt 的文件系统路由迁移到 Vue Router
- 路由配置在 `src/router/index.ts`
- 页面文件从 `pages/` 迁移到 `views/`

### 2. 工具函数
- `$fetch`: 替代 Nuxt 的 `$fetch`，在 `src/utils/fetch.ts`
- `navigateTo`: 替代 Nuxt 的 `navigateTo`，在 `src/utils/navigation.ts`
- 全局声明，页面可以直接使用（类似 Nuxt 的自动导入）

### 3. 组件和页面
- 所有组件和页面代码保持不变
- `NuxtLink` 已替换为 `RouterLink`
- `useRoute`, `useRouter` 等从 `vue-router` 导入

### 4. 代理配置
- Vite 开发服务器代理配置在 `vite.config.ts`
- `/api/*` 请求自动代理到后端服务（`http://localhost:3001`）

## 启动项目

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 构建生产版本
bun build

# 预览生产版本
bun preview
```

## 注意事项

1. **页面文件命名**：Vue Router 使用 `:id` 作为动态参数，但文件系统仍使用 `[id]` 命名
2. **全局函数**：`$fetch`, `navigateTo`, `useRoute` 等已全局声明，页面可以直接使用
3. **路由守卫**：认证和权限检查在 `src/router/index.ts` 的 `beforeEach` 中
4. **API 调用**：所有 API 调用通过 Vite 代理转发到后端服务

## 兼容性

- ✅ 所有页面代码保持不变
- ✅ 所有组件代码保持不变
- ✅ API 调用方式保持不变（使用 `$fetch`）
- ✅ 状态管理保持不变（Pinia）
- ✅ 样式和 UI 保持不变

