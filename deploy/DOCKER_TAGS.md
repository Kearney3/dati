# 🐳 Docker Hub Tag 配置指南

本文档详细说明如何在GitHub Actions中配置Docker Hub镜像的tag策略。

## 📋 当前配置

项目使用 `docker/metadata-action` 来自动生成Docker镜像的tag，支持多种tag策略：

### 自动生成的Tag类型

1. **分支Tag** (`type=ref,event=branch`)
   - 格式：`kearney/dati:main`
   - 适用于：每次推送到分支时

2. **PR Tag** (`type=ref,event=pr`)
   - 格式：`kearney/dati:pr-123`
   - 适用于：Pull Request时

3. **语义化版本Tag** (`type=semver,pattern={{version}}`)
   - 格式：`kearney/dati:v1.2.3`
   - 适用于：发布版本时

4. **主次版本Tag** (`type=semver,pattern={{major}}.{{minor}}`)
   - 格式：`kearney/dati:1.2`
   - 适用于：发布版本时

5. **主版本Tag** (`type=semver,pattern={{major}}`)
   - 格式：`kearney/dati:1`
   - 适用于：发布版本时

6. **Latest Tag** (`type=raw,value=latest,enable={{is_default_branch}}`)
   - 格式：`kearney/dati:latest`
   - 适用于：默认分支（main）时

7. **Commit SHA Tag** (`type=raw,value=${{ github.sha }},enable={{is_default_branch}}`)
   - 格式：`kearney/dati:abc1234`
   - 适用于：默认分支（main）时

## 🚀 使用方法

### 1. 发布版本（推荐）

当您要发布新版本时，创建一个Git tag：

```bash
# 创建并推送tag
git tag v1.2.3
git push origin v1.2.3
```

这将自动生成以下tag：
- `kearney/dati:v1.2.3`
- `kearney/dati:1.2`
- `kearney/dati:1`
- `kearney/dati:latest`
- `kearney/dati:abc1234` (commit SHA)

### 2. 日常开发

每次推送到main分支时，会生成：
- `kearney/dati:main`
- `kearney/dati:latest`
- `kearney/dati:abc1234` (commit SHA)

### 3. Pull Request

创建PR时会生成：
- `kearney/dati:pr-123`

## ⚙️ 自定义配置

### 修改Tag策略

您可以在 `.github/workflows/deploy.yml` 中修改tag配置：

```yaml
- name: Extract metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ${{ secrets.DOCKER_USERNAME }}/dati
    tags: |
      # 只使用语义化版本
      type=semver,pattern={{version}}
      type=raw,value=latest,enable={{is_default_branch}}
      
      # 或者使用日期格式
      type=raw,value={{date 'YYYYMMDD'}}
      type=raw,value={{date 'YYYYMMDD-HHmmss'}}
      
      # 或者使用环境变量
      type=raw,value=${{ env.CUSTOM_TAG }}
```

### 常用Tag模式

#### 1. 简单版本控制
```yaml
tags: |
  type=semver,pattern={{version}}
  type=raw,value=latest,enable={{is_default_branch}}
```

#### 2. 日期版本控制
```yaml
tags: |
  type=raw,value={{date 'YYYYMMDD'}}
  type=raw,value=latest,enable={{is_default_branch}}
```

#### 3. 完整版本控制
```yaml
tags: |
  type=semver,pattern={{version}}
  type=semver,pattern={{major}}.{{minor}}
  type=semver,pattern={{major}}
  type=raw,value=latest,enable={{is_default_branch}}
  type=raw,value=${{ github.sha }},enable={{is_default_branch}}
```

## 🔧 环境变量配置

确保在GitHub仓库的Settings → Secrets and variables → Actions中配置以下secrets：

- `DOCKER_USERNAME`: Docker Hub用户名
- `DOCKER_PASSWORD`: Docker Hub密码或访问令牌

## 📝 最佳实践

1. **使用语义化版本**：遵循 `v1.2.3` 格式
2. **保持latest标签**：始终指向最新稳定版本
3. **使用commit SHA**：便于调试和回滚
4. **避免过多tag**：只保留必要的版本标签

## 🐛 故障排除

### 常见问题

1. **Tag未生成**
   - 检查GitHub Actions是否成功运行
   - 确认Docker Hub凭据是否正确
   - 查看工作流日志中的错误信息

2. **Tag格式错误**
   - 检查tag配置语法
   - 确认版本号格式正确
   - 验证环境变量是否设置

3. **权限问题**
   - 确认Docker Hub账户有推送权限
   - 检查GitHub Secrets配置

### 调试命令

```bash
# 查看本地tag
git tag -l

# 推送所有tag
git push origin --tags

# 删除远程tag
git push origin :refs/tags/v1.0.0
```

## 📚 参考资源

- [docker/metadata-action 文档](https://github.com/docker/metadata-action)
- [Docker Hub 官方文档](https://docs.docker.com/docker-hub/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

⭐ 如果这个配置指南对您有帮助，请给项目一个星标！
