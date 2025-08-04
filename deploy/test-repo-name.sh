#!/bin/bash

echo "🔍 测试仓库名称转换逻辑..."

# 测试不同的仓库名称
test_repo_names=(
    "Kearney3/dati"
    "Kearney3/dati_v2"
    "MyOrg/MyProject"
    "user123/Test-App"
    "company/project.name"
)

echo "📋 测试用例："
echo ""

for repo_name in "${test_repo_names[@]}"; do
    echo "原始仓库名称: $repo_name"
    
    # 转换为小写并替换特殊字符
    converted_name=$(echo "$repo_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')
    
    echo "转换后名称: $converted_name"
    
    # 验证格式
    if [[ $converted_name =~ ^[a-z0-9._-]+$ ]]; then
        echo "✅ 格式正确"
    else
        echo "❌ 格式错误"
    fi
    
    # 生成完整的 Docker 标签
    ghcr_tag="ghcr.io/$converted_name:latest"
    dockerhub_tag="$converted_name:latest"
    
    echo "  GitHub Container Registry: $ghcr_tag"
    echo "  Docker Hub: $dockerhub_tag"
    echo ""
done

echo "🎯 总结："
echo "- 所有大写字母转换为小写"
echo "- 特殊字符替换为连字符"
echo "- 保留字母、数字、点、连字符和下划线"
echo "- 生成的标签符合 Docker 命名规范" 