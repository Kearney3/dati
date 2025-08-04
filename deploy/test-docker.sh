#!/bin/bash

echo "Testing Docker build..."

# 构建 Docker 镜像
docker build -f deploy/Dockerfile -t dati-quiz-app:test .

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # 运行容器进行测试
    echo "Starting container for testing..."
    docker run -d --name dati-test -p 5080:5080 dati-quiz-app:test
    
    # 等待容器启动
    sleep 5
    
    # 检查容器是否运行
    if docker ps | grep -q dati-test; then
        echo "✅ Container is running!"
        echo "🌐 Application should be available at: http://localhost:5080"
        
        # 清理测试容器
        docker stop dati-test
        docker rm dati-test
    else
        echo "❌ Container failed to start"
    fi
    
    # 清理测试镜像
    docker rmi dati-quiz-app:test
else
    echo "❌ Docker build failed!"
    exit 1
fi 