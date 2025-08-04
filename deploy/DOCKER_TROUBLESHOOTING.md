# Docker 部署故障排除指南

## 🔍 常见错误及解决方案

### 1. 401 Unauthorized 错误

**错误信息**：
```
ERROR: failed to build: failed to solve: failed to fetch oauth token: unexpected status from GET request to https://auth.docker.io/token?scope=repository%3A***%2Fdati-quiz-app%3Apull%2Cpush&service=registry.docker.io: 401 Unauthorized
```

**原因**：Docker Hub 认证失败

**解决方案**：

#### 方案A：使用 Docker Hub 访问令牌

1. **创建访问令牌**：
   - 登录 [Docker Hub](https://hub.docker.com/)
   - 进入 Account Settings → Security
   - 点击 "New Access Token"
   - 名称：`GitHub Actions`
   - 权限：选择 "Read & Write"
   - 生成并复制令牌

2. **配置 GitHub Secrets**：
   - 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
   - 添加 `DOCKER_USERNAME`：你的 Docker Hub 用户名
   - 添加 `DOCKER_PASSWORD`：刚才创建的访问令牌

#### 方案B：使用 GitHub Container Registry（推荐）

无需额外配置，直接使用 GitHub 的容器注册表：

```yaml
# 在 .github/workflows/deploy.yml 中
- name: Build and push Docker image to GHCR
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./deploy/Dockerfile
    push: true
    tags: |
      ghcr.io/${{ github.repository }}:latest
      ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### 2. 文件路径错误

**错误信息**：
```
ERROR: failed to build: failed to solve: failed to compute cache key: failed to calculate checksum of ref lxw5o9qk2g5i2dq4lfazsw37y::k0mrr5y2l46aal1533ms6zl0m: "/nginx.conf": not found
```

**解决方案**：
确保 Dockerfile 中的文件路径正确：

```dockerfile
# 正确的路径（构建上下文为项目根目录）
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
```

### 3. 端口配置错误

**问题**：nginx 配置和 Dockerfile 端口不匹配

**解决方案**：
确保 nginx.conf 中的端口与 Dockerfile 中的 EXPOSE 一致：

```nginx
# nginx.conf
server {
    listen 5080;  # 与 Dockerfile 中的 EXPOSE 5080 一致
    # ...
}
```

## 🚀 推荐的部署方案

### 方案1：GitHub Container Registry（推荐）

**优点**：
- 无需额外认证配置
- 与 GitHub 集成良好
- 免费额度充足

**配置**：
```yaml
# .github/workflows/deploy.yml
build-docker-ghcr:
  needs: build
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  permissions:
    contents: read
    packages: write
    
  steps:
  - name: Checkout code
    uses: actions/checkout@v4
    
  - name: Set up Docker Buildx
    uses: docker/setup-buildx-action@v3
    
  - name: Build and push Docker image to GHCR
    uses: docker/build-push-action@v5
    with:
      context: .
      file: ./deploy/Dockerfile
      push: true
      tags: |
        ghcr.io/${{ github.repository }}:latest
        ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### 方案2：Docker Hub

**配置步骤**：
1. 创建 Docker Hub 访问令牌
2. 配置 GitHub Secrets
3. 确保仓库权限正确

## 🔧 本地测试

### 测试 Docker 构建

```bash
# 构建镜像
docker build -f deploy/Dockerfile -t dati-quiz-app:test .

# 运行容器
docker run -d --name dati-test -p 5080:5080 dati-quiz-app:test

# 检查容器状态
docker ps

# 访问应用
curl http://localhost:5080

# 清理
docker stop dati-test
docker rm dati-test
docker rmi dati-quiz-app:test
```

### 使用测试脚本

```bash
# 运行测试脚本
./deploy/test-docker.sh
```

## 📋 检查清单

- [ ] Dockerfile 中的文件路径正确
- [ ] nginx.conf 端口配置正确
- [ ] GitHub Secrets 已配置（如果使用 Docker Hub）
- [ ] 仓库权限设置正确
- [ ] 本地测试通过

## 🆘 获取帮助

如果问题仍然存在：

1. 检查 GitHub Actions 日志中的详细错误信息
2. 确认所有配置步骤已完成
3. 尝试本地构建测试
4. 查看 Docker Hub 账户状态和权限

## 📚 相关链接

- [Docker Hub 访问令牌文档](https://docs.docker.com/docker-hub/access-tokens/)
- [GitHub Container Registry 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions 文档](https://docs.github.com/en/actions) 