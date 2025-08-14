# 🚀 部署指南

本项目支持多种部署方式，您可以根据需求选择最适合的方案。

## 📋 目录

- [🌟 一键部署](#-一键部署)
- [📦 命令行部署](#-命令行部署)
- [🔧 自动化部署配置](#-自动化部署配置)
- [🐳 Docker 部署](#-docker-部署)
- [📚 GitHub Pages 部署](#-github-pages-部署)
- [⚙️ 高级配置](#️-高级配置)
- [🔍 故障排除](#-故障排除)

## 🌟 一键部署

### Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kearney3/dati)

**优势**：
- 自动 HTTPS
- 全球 CDN
- 自动预览部署
- 零配置

### Netlify 部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Kearney3/dati)

**优势**：
- 强大的表单处理
- 丰富的插件生态
- 详细的访问统计

## 📦 命令行部署

### Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

### Netlify CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 构建项目
npm run build

# 部署到生产环境
netlify deploy --prod --dir=dist
```

## 🔧 自动化部署配置

### GitHub Actions 自动部署

项目已配置 GitHub Actions 工作流，支持推送到 `main` 分支时自动部署。

#### 1. Vercel 自动化部署配置

**获取必要的配置信息**：

1. **获取 Vercel Token**：
   - 访问 [Vercel Account Tokens](https://vercel.com/account/tokens)
   - 点击 "Create Token"
   - 填写名称：`GitHub Actions Deploy`
   - 选择 Scope：`Full Account`
   - 复制生成的 Token

2. **获取 Project ID 和 Org ID**：
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 进入项目 `dati`
   - 点击 "Settings" 标签
   - 复制 Project ID 和 Team ID（Org ID）

**配置 GitHub Secrets**：

1. 进入 GitHub 仓库设置：`Settings` → `Secrets and variables` → `Actions`
2. 添加以下 secrets：

| Secret 名称 | 说明 | 值 |
|------------|------|-----|
| `VERCEL_TOKEN` | Vercel 访问令牌 | 从步骤 1 获取的 Token |
| `VERCEL_ORG_ID` | 组织/团队 ID | 从步骤 2 获取的 Team ID |
| `VERCEL_PROJECT_ID` | 项目 ID | 从步骤 2 获取的 Project ID |

#### 2. Netlify 自动化部署配置

**获取必要的配置信息**：

1. **获取 Auth Token**：
   - 在 Netlify 控制台中，点击右上角的用户头像
   - 选择 "User settings"
   - 在左侧菜单中点击 "Applications"
   - 点击 "New access token"
   - 输入 token 名称（如 "GitHub Actions"）
   - 复制生成的 token

2. **获取 Site ID**：
   - 在 Netlify 控制台中，进入你的站点
   - 点击 "Site settings"
   - 在 "General" 标签页中找到 "Site information"
   - 复制 "Site ID"

**配置 GitHub Secrets**：

1. 进入 GitHub 仓库设置：`Settings` → `Secrets and variables` → `Actions`
2. 添加以下 secrets：

| Secret 名称 | 说明 | 值 |
|------------|------|-----|
| `NETLIFY_AUTH_TOKEN` | Netlify 认证令牌 | 从步骤 1 获取的 Auth Token |
| `NETLIFY_SITE_ID` | 站点 ID | 从步骤 2 获取的 Site ID |

### 验证配置

配置完成后，当你推送代码到 `main` 分支时，GitHub Actions 将自动：

1. 构建项目
2. 部署到选择的平台
3. 在 Pull Request 中显示部署链接

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 进入部署目录
cd deploy

# 启动基础服务
docker compose up -d

# 启动包含反向代理的完整环境
docker compose --profile proxy up -d
```

### 使用 Docker 命令

```bash
# 构建镜像
docker build -f deploy/Dockerfile -t dati .

# 运行容器
docker run -d -p 5080:5080 --name dati dati

# 查看容器状态
docker ps

# 查看日志
docker logs dati
```

### Docker 配置说明

- **端口映射**：`5080:5080`
- **数据持久化**：支持挂载本地目录
- **反向代理**：包含 Nginx 配置
- **移动端访问**：支持局域网访问

详细配置请查看 [deploy/README.md](deploy/README.md)

## 📚 GitHub Pages 部署

项目已配置 GitHub Pages 自动部署，推送到 `main` 分支即可自动部署。

**访问地址**：`https://username.github.io/dati`

**注意事项**：
- 需要配置正确的 base 路径
- 项目已自动适配 GitHub Pages 环境
- 支持自定义域名

## ⚙️ 高级配置

### 环境变量配置

#### Vercel 环境变量

1. 在 Vercel 控制台中，进入项目设置
2. 点击 "Environment Variables"
3. 添加需要的环境变量

#### Netlify 环境变量

1. 在 Netlify 控制台中，进入站点设置
2. 点击 "Environment variables"
3. 添加需要的环境变量

### 自定义域名配置

#### Vercel 自定义域名

1. 在 Vercel 控制台中，进入项目
2. 点击 "Settings" → "Domains"
3. 点击 "Add Domain"
4. 按照提示配置 DNS 记录

#### Netlify 自定义域名

1. 在 Netlify 控制台中，进入站点
2. 点击 "Domain settings"
3. 点击 "Add custom domain"
4. 按照提示配置 DNS 记录

### 构建优化

#### 构建命令优化

```bash
# 生产环境构建
npm ci --production=false && npm run build

# 开发环境构建
npm run build
```

#### 缓存配置

```yaml
# .github/workflows/deploy.yml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

## 🔍 故障排除

### 常见问题

#### 1. 构建失败

**可能原因**：
- Node.js 版本不兼容（项目要求 Node.js 24+）
- 依赖包版本冲突
- 构建配置错误

**解决方案**：
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 检查 Node.js 版本
node --version
```

#### 2. 部署失败

**可能原因**：
- GitHub Secrets 配置错误
- 平台认证失败
- 网络连接问题

**解决方案**：
- 检查 GitHub Secrets 是否正确配置
- 确认平台 Token 是否有效
- 查看 GitHub Actions 详细日志

#### 3. 404 错误

**可能原因**：
- 路由配置错误
- 静态文件路径问题
- 平台配置不正确

**解决方案**：
- 检查 `vercel.json` 或 `netlify.toml` 配置
- 确认重定向规则是否正确
- 验证构建输出目录

#### 4. 移动端访问问题

**可能原因**：
- 网络配置问题
- 防火墙设置
- 端口被占用

**解决方案**：
```bash
# 检查端口占用
lsof -i :5080

# 检查防火墙设置
sudo ufw status

# 使用 Docker 部署（推荐）
cd deploy && docker compose up -d
```

### 调试步骤

1. **查看构建日志**：
   - GitHub Actions：查看工作流运行日志
   - Vercel：在控制台查看部署日志
   - Netlify：在控制台查看构建日志

2. **本地测试**：
   ```bash
   # 本地构建测试
   npm run build
   npm run preview
   ```

3. **环境检查**：
   ```bash
   # 检查 Node.js 版本
   node --version
   
   # 检查 npm 版本
   npm --version
   
   # 检查依赖
   npm ls
   ```

### 获取帮助

如果遇到问题，请：

1. 查看 [GitHub Issues](../../issues)
2. 检查 [项目文档](../README.md)
3. 查看 [部署配置文档](deploy/README.md)
4. 提交新的 Issue 描述问题

---

## 📞 支持

如有部署相关问题，请通过以下方式获取帮助：

- 📧 创建 [GitHub Issue](../../issues)
- 💬 在 [GitHub Discussions](../../discussions) 中讨论
- 📖 查看 [项目文档](../README.md)

---

⭐ 如果这个部署指南对您有帮助，请给项目一个星标！
