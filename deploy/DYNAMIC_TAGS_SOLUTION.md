# 动态 Docker 标签生成解决方案

## 🎯 问题背景

原始问题：Docker 镜像标签中的仓库名称必须是小写字母，但 GitHub 仓库名称可能包含大写字母。

**错误示例**：
```
ERROR: failed to build: invalid tag "ghcr.io/Kearney3/dati:latest": repository name must be lowercase
```

## 🚀 解决方案

### 动态标签生成

在 GitHub Actions 工作流中添加一个步骤，动态生成符合 Docker 命名规范的标签：

```yaml
- name: Generate lowercase repository name
  id: repo-name
  run: |
    # 将仓库名称转换为小写并替换特殊字符
    REPO_NAME=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')
    echo "repo-name=$REPO_NAME" >> $GITHUB_OUTPUT
    echo "Generated repository name: $REPO_NAME"
```

### 转换规则

1. **大写转小写**：`Kearney3` → `kearney3`
2. **特殊字符替换**：`/` → `-`
3. **保留有效字符**：字母、数字、点、连字符、下划线

### 转换示例

| 原始仓库名称 | 转换后名称 | Docker 标签 |
|-------------|-----------|-------------|
| `Kearney3/dati` | `kearney3-dati` | `ghcr.io/kearney3-dati:latest` |
| `Kearney3/dati_v2` | `kearney3-dati_v2` | `ghcr.io/kearney3-dati_v2:latest` |
| `MyOrg/MyProject` | `myorg-myproject` | `ghcr.io/myorg-myproject:latest` |
| `user123/Test-App` | `user123-test-app` | `ghcr.io/user123-test-app:latest` |

## 📋 完整配置

### GitHub Container Registry

```yaml
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
    
  - name: Generate lowercase repository name
    id: repo-name
    run: |
      REPO_NAME=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')
      echo "repo-name=$REPO_NAME" >> $GITHUB_OUTPUT
      echo "Generated repository name: $REPO_NAME"
      
  - name: Build and push Docker image to GHCR
    uses: docker/build-push-action@v5
    with:
      context: .
      file: ./deploy/Dockerfile
      push: true
      tags: |
        ghcr.io/${{ steps.repo-name.outputs.repo-name }}:latest
        ghcr.io/${{ steps.repo-name.outputs.repo-name }}:${{ github.sha }}
```

### Docker Hub

```yaml
build-docker:
  needs: build
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
  - name: Checkout code
    uses: actions/checkout@v4
    
  - name: Set up Docker Buildx
    uses: docker/setup-buildx-action@v3
    
  - name: Generate lowercase repository name
    id: repo-name-dockerhub
    run: |
      REPO_NAME=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')
      echo "repo-name=$REPO_NAME" >> $GITHUB_OUTPUT
      echo "Generated repository name: $REPO_NAME"
      
  - name: Login to Docker Hub
    uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKER_USERNAME }}
      password: ${{ secrets.DOCKER_PASSWORD }}
      
  - name: Build and push Docker image
    uses: docker/build-push-action@v5
    with:
      context: .
      file: ./deploy/Dockerfile
      push: true
      tags: |
        ${{ secrets.DOCKER_USERNAME }}/${{ steps.repo-name-dockerhub.outputs.repo-name }}:latest
        ${{ secrets.DOCKER_USERNAME }}/${{ steps.repo-name-dockerhub.outputs.repo-name }}:${{ github.sha }}
```

## ✅ 优势

1. **通用性**：适用于任何仓库名称，无需硬编码
2. **自动化**：自动处理大小写和特殊字符
3. **兼容性**：生成的标签符合 Docker 命名规范
4. **可维护性**：仓库重命名时无需修改工作流

## 🔧 测试

使用测试脚本验证转换逻辑：

```bash
./deploy/test-repo-name.sh
```

## 📚 相关文件

- [GitHub Actions 工作流](../.github/workflows/deploy.yml)
- [测试脚本](test-repo-name.sh)

---

🎉 **这个解决方案是通用的，适用于任何 GitHub 仓库！** 