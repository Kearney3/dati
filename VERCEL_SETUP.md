# Vercel 自动部署配置指南

## 1. 获取 Vercel 配置信息

### 1.1 获取 Vercel Token

1. 访问 [Vercel Account Tokens](https://vercel.com/account/tokens)
2. 点击 "Create Token"
3. 填写以下信息：
   - **Name**: `GitHub Actions Deploy`
   - **Scope**: `Full Account`
4. 点击 "Create"
5. **复制生成的 Token**（注意：Token 只显示一次）

### 1.2 获取 Project ID 和 Org ID

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目 `dati`
3. 点击 "Settings" 标签
4. 在 "General" 部分找到：
   - **Project ID**: 复制这个 ID
   - **Team ID**: 这就是 Org ID（如果你在团队中）

## 2. 配置 GitHub Secrets

### 2.1 进入 GitHub 仓库设置

1. 访问你的 GitHub 仓库: `https://github.com/Kearney3/dati`
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Secrets and variables" → "Actions"

### 2.2 添加 Secrets

点击 "New repository secret" 添加以下三个 secrets：

#### VERCEL_TOKEN
- **Name**: `VERCEL_TOKEN`
- **Value**: 粘贴你从步骤 1.1 获取的 Token

#### VERCEL_ORG_ID
- **Name**: `VERCEL_ORG_ID`
- **Value**: 粘贴你的 Team ID 或 Org ID

#### VERCEL_PROJECT_ID
- **Name**: `VERCEL_PROJECT_ID`
- **Value**: 粘贴你的 Project ID

## 3. 验证配置

### 3.1 检查 Secrets 是否配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 页面中，你应该能看到：
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID

### 3.2 测试部署

1. 推送代码到 main 分支：
   ```bash
   git add .
   git commit -m "feat: 配置Vercel自动部署"
   git push origin main
   ```

2. 检查 GitHub Actions：
   - 访问 `https://github.com/Kearney3/dati/actions`
   - 查看最新的工作流运行状态

3. 检查 Vercel 部署：
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 查看项目的最新部署状态

## 4. 故障排除

### 4.1 常见错误

#### "Input required and not supplied: vercel-token"
- **原因**: VERCEL_TOKEN secret 未配置
- **解决**: 按照步骤 2.2 配置 VERCEL_TOKEN

#### "Project not found"
- **原因**: VERCEL_PROJECT_ID 错误
- **解决**: 重新检查并更新 Project ID

#### "Organization not found"
- **原因**: VERCEL_ORG_ID 错误
- **解决**: 重新检查并更新 Org ID

### 4.2 调试步骤

1. 确认所有 secrets 都已正确配置
2. 检查 Vercel Token 是否有效
3. 确认项目在 Vercel 中存在
4. 查看 GitHub Actions 的详细日志

## 5. 部署流程

配置完成后，每次推送到 `main` 分支时：

1. ✅ 代码检查（Lint + Type Check）
2. ✅ 构建应用
3. ✅ 部署到 GitHub Pages
4. ✅ 部署到 Vercel
5. ✅ 构建 Docker 镜像

## 6. 监控部署

- **GitHub Actions**: `https://github.com/Kearney3/dati/actions`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **部署 URL**: 部署成功后会在 Vercel 中显示

---

**注意**: 请妥善保管你的 Vercel Token，不要分享给他人或在公开场合暴露。
