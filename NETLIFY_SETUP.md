# Netlify 部署配置指南

本文档将指导你如何配置 Netlify 自动化部署。

## 1. 创建 Netlify 站点

### 方法一：通过 Netlify 控制台创建

1. 访问 [Netlify](https://netlify.com) 并登录
2. 点击 "New site from Git"
3. 选择 GitHub 并授权访问你的仓库
4. 选择 `dati` 仓库
5. 配置部署设置：
   - **Build command**: `npm ci --production=false && npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: 留空（如果项目在根目录）
   - **Node.js version**: 24 (自动检测)

### 方法二：通过拖拽部署（仅用于测试）

1. 在本地运行 `npm run build`
2. 将生成的 `dist` 文件夹拖拽到 Netlify 的部署区域

## 2. 获取必要的配置信息

### 获取 Auth Token

1. 在 Netlify 控制台中，点击右上角的用户头像
2. 选择 "User settings"
3. 在左侧菜单中点击 "Applications"
4. 点击 "New access token"
5. 输入 token 名称（如 "GitHub Actions"）
6. 复制生成的 token（注意保存，因为只显示一次）

### 获取 Site ID

1. 在 Netlify 控制台中，进入你的站点
2. 点击 "Site settings"
3. 在 "General" 标签页中找到 "Site information"
4. 复制 "Site ID"

## 3. 配置 GitHub Secrets

在你的 GitHub 仓库中配置以下 secrets：

1. 进入仓库设置：`Settings` → `Secrets and variables` → `Actions`
2. 点击 "New repository secret"
3. 添加以下 secrets：

### NETLIFY_AUTH_TOKEN
- **Name**: `NETLIFY_AUTH_TOKEN`
- **Value**: 从步骤 2 获取的 Auth Token

### NETLIFY_SITE_ID
- **Name**: `NETLIFY_SITE_ID`
- **Value**: 从步骤 2 获取的 Site ID

## 4. 验证配置

配置完成后，当你推送代码到 `main` 分支时，GitHub Actions 将自动：

1. 构建项目
2. 部署到 Netlify
3. 在 Pull Request 中显示部署链接

## 5. 自定义域名（可选）

1. 在 Netlify 控制台中，进入你的站点
2. 点击 "Domain settings"
3. 点击 "Add custom domain"
4. 按照提示配置你的域名

## 6. 环境变量（可选）

如果需要配置环境变量：

1. 在 Netlify 控制台中，进入你的站点
2. 点击 "Site settings"
3. 在左侧菜单中点击 "Environment variables"
4. 添加需要的环境变量

## 7. 故障排除

### 常见问题

1. **构建失败**
   - 检查 `netlify.toml` 配置是否正确
   - 确认 Node.js 版本兼容性（项目要求 Node.js 24+）
   - 确保所有依赖都是最新版本

2. **部署失败**
   - 检查 GitHub Secrets 是否正确配置
   - 确认 Netlify Auth Token 是否有效

3. **404 错误**
   - 确认 `netlify.toml` 中的重定向规则配置正确

### 查看部署日志

1. 在 Netlify 控制台中查看部署日志
2. 在 GitHub Actions 中查看构建日志

## 8. 高级配置

### 分支部署

Netlify 支持自动为每个分支创建预览部署：

1. 在 Netlify 控制台中，进入 "Site settings"
2. 点击 "Build & deploy"
3. 在 "Deploy contexts" 中配置分支部署规则

### 表单处理

如果应用包含表单，Netlify 可以自动处理：

1. 在 Netlify 控制台中，进入 "Site settings"
2. 点击 "Forms"
3. 配置表单处理选项

## 9. 性能优化

### 缓存策略

`netlify.toml` 中已配置了缓存策略：

- 静态资源（JS、CSS）缓存 1 年
- 图片缓存 1 年
- 启用 immutable 缓存

### 压缩

Netlify 自动启用 Gzip 压缩，无需额外配置。

## 10. 安全配置

`netlify.toml` 中已配置了安全头：

- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: 已配置基本策略

---

完成以上配置后，你的应用将实现 Netlify 的自动化部署！
