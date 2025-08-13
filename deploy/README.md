# 部署指南

本项目支持多种部署方式，以下是详细的部署说明。

## 🚀 快速部署

### 1. Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kearney3/dati)

**手动部署步骤：**

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录到 Vercel
vercel login

# 3. 部署项目
vercel --prod
```

**配置说明：**
- 构建命令：`npm run build`
- 输出目录：`dist`
- Node.js 版本：18.x（推荐）
- 框架：Vite + React

### 2. Netlify 部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Kearney3/dati)

**手动部署步骤：**

```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录到 Netlify
netlify login

# 3. 构建项目
npm run build

# 4. 部署
netlify deploy --prod --dir=dist
```

### 3. GitHub Pages 部署

1. 在 GitHub 仓库中启用 Pages
2. 选择 "GitHub Actions" 作为部署源
3. 推送代码到 main 分支，自动触发部署

### 4. Docker 部署

**使用 Docker：**

```bash
# 构建镜像
docker build -f deploy/Dockerfile -t dati .

# 运行容器
docker run -d -p 5080:5080 --name dati dati
```

**使用 Docker Compose：**

```bash
# 启动服务
cd deploy
docker compose up -d

# 启动包含反向代理的完整环境
docker compose --profile proxy up -d

# 停止服务
docker compose down
```

## 🛠️ 部署配置

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 端口号（Docker） | `5080` |
| `VERCEL` | Vercel部署标识 | 自动设置 |
| `NETLIFY` | Netlify部署标识 | 自动设置 |

### 构建配置

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "nodeVersion": "18"
}
```

## 🔧 自定义部署

### 修改构建脚本

在 `package.json` 中可以添加自定义构建脚本：

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production npm run build",
    "build:staging": "NODE_ENV=staging npm run build"
  }
}
```

### 环境特定配置

可以在 `vite.config.ts` 中添加环境特定配置：

```typescript
export default defineConfig(({ mode }) => {
  return {
    // 环境特定配置
    base: mode === 'production' ? '/dati/' : '/',
    // ...其他配置
  }
})
```

## 🌐 域名配置

### 自定义域名

**Vercel：**
1. 在 Vercel 控制台添加域名
2. 配置 DNS 记录

**Netlify：**
1. 在 Netlify 控制台添加域名
2. 配置 DNS 记录

**Docker 部署：**
1. 修改 `nginx-proxy.conf` 中的 `server_name`
2. 配置 SSL 证书（可选）

## 📊 性能优化

### 构建优化

```bash
# 预览构建结果
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 缓存配置

- 静态资源缓存：1年（js、css、图片等）
- HTML 文件：无缓存（确保路由正常工作）
- 字体文件：1年缓存
- API 响应：根据需要配置

## 🔒 安全配置

### Content Security Policy

在 `netlify.toml` 和 nginx 配置中已包含基本的 CSP 配置。

### HTTPS 配置

- Vercel/Netlify：自动配置
- Docker 部署：需要手动配置 SSL 证书

## 🚨 故障排除

### 常见问题

**构建失败：**
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**路由问题：**
- 确保配置了 SPA 路由重定向
- 检查 `vercel.json` 或 `netlify.toml` 配置
- 确认 `vite.config.ts` 中的 `base` 配置正确

**静态资源加载失败：**
- 检查 `base` 配置
- 确认资源路径正确
- 验证构建输出目录是否为 `dist`

### 日志查看

**Docker：**
```bash
# 查看容器日志
docker logs dati

# 查看实时日志
docker logs -f dati

# 查看容器状态
docker ps
```

**Vercel：**
在 Vercel 控制台查看函数日志

**Netlify：**
在 Netlify 控制台查看部署日志

## 📈 监控

### 性能监控

推荐使用：
- Vercel Analytics
- Netlify Analytics
- Google Analytics
- Web Vitals

### 错误监控

推荐使用：
- Sentry
- Bugsnag
- LogRocket

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进部署配置！