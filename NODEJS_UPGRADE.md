# Node.js 版本升级指南

## 🚀 升级到 Node.js 24+

本项目已升级到 Node.js 24+ 版本，以获得更好的性能和安全性。

## 📋 升级内容

### 1. 配置文件更新

- **GitHub Actions**: `.github/workflows/deploy.yml` - Node.js 版本从 18 升级到 24
- **Netlify**: `netlify.toml` - Node.js 版本从 18 升级到 24
- **Package.json**: 添加了 `engines` 字段，指定 Node.js >= 24.0.0
- **TypeScript**: 目标版本从 ES2020 升级到 ES2022

### 2. 版本要求

```json
{
  "engines": {
    "node": ">=24.0.0",
    "npm": ">=10.0.0"
  }
}
```

## 🔧 本地开发环境升级

### 检查当前版本
```bash
node --version
npm --version
```

### 升级 Node.js

#### 使用 nvm (推荐)
```bash
# 安装 Node.js 24
nvm install 24
nvm use 24
nvm alias default 24

# 验证版本
node --version  # 应该显示 v24.x.x
```

#### 使用官方安装包
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载并安装 Node.js 24 LTS 版本
3. 验证安装：`node --version`

### 升级 npm
```bash
npm install -g npm@latest
npm --version  # 应该显示 10.x.x 或更高
```

## 🧹 清理和重新安装

升级后建议清理并重新安装依赖：

```bash
# 删除旧的依赖
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 验证构建
npm run build
```

## ✅ 验证升级

### 1. 检查版本兼容性
```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 验证项目构建
npm run build
```

### 2. 运行测试
```bash
# 类型检查
npm run type-check

# 代码检查
npm run lint

# 开发服务器
npm run dev
```

## 🚨 注意事项

### 1. 依赖兼容性
- 所有项目依赖都已验证与 Node.js 24 兼容
- 如果遇到兼容性问题，请更新相关依赖

### 2. 构建工具
- Vite 5.0+ 完全支持 Node.js 24
- TypeScript 5.0+ 支持最新的 ES2022 特性

### 3. 部署环境
- GitHub Actions 已配置使用 Node.js 24
- Netlify 已配置使用 Node.js 24
- Vercel 会自动检测并使用 Node.js 24

## 🔄 回滚方案

如果需要回滚到 Node.js 18：

```bash
# 使用 nvm 切换版本
nvm install 18
nvm use 18

# 更新配置文件中的版本号
# 将 .github/workflows/deploy.yml 和 netlify.toml 中的版本改回 18
```

## 📊 性能提升

Node.js 24 相比 Node.js 18 的主要改进：

- **性能提升**: 更快的启动时间和运行时性能
- **内存优化**: 更好的内存管理和垃圾回收
- **安全性**: 最新的安全补丁和功能
- **ES 特性**: 支持更多现代 JavaScript 特性
- **稳定性**: 更稳定的运行时环境

## 🎉 完成！

升级完成后，你将获得：

1. **更好的性能**: 更快的构建和运行速度
2. **增强的安全性**: 最新的安全补丁
3. **现代特性**: 支持最新的 JavaScript 特性
4. **长期支持**: Node.js 24 将获得更长期的支持

现在可以享受 Node.js 24 带来的所有优势了！🚀
