# 智能答题系统

一个现代化的智能答题系统，支持Excel文件导入，提供多种测验模式和完善的用户体验。

## ✨ 功能特性

### 📊 Excel文件支持
- 支持 `.xlsx` 和 `.xls` 格式文件
- 多工作表数据导入
- 智能表头识别和映射
- 自动数据验证和错误提示

### 🎯 多种测验模式
- **练习模式**: 自由练习，实时反馈
- **考试模式**: 模拟真实考试环境
- **背诵模式**: 专注于记忆和复习
- **随机模式**: 题目随机排序

### 🎨 现代化界面
- 响应式设计，支持移动端
- 深色/浅色主题切换
- 流畅的动画效果
- 直观的用户交互

### 📈 智能功能
- 进度跟踪和统计
- 错题回顾和复习
- 结果导出和分享
- 本地数据存储

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装和运行

```bash
# 克隆项目
git clone <repository-url>
cd dati_v2

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📁 项目结构

```
dati_v2/
├── src/                    # 源代码
│   ├── components/         # React组件
│   │   ├── FileUpload.tsx      # 文件上传
│   │   ├── HeaderMapping.tsx   # 表头映射
│   │   ├── SheetSelector.tsx   # 工作表选择
│   │   ├── ExamConfig.tsx      # 考试配置
│   │   ├── QuizSettings.tsx    # 测验设置
│   │   ├── QuizScreen.tsx      # 测验界面
│   │   ├── ReviewScreen.tsx    # 复习界面
│   │   ├── ResultsScreen.tsx   # 结果展示
│   │   └── ThemeToggle.tsx     # 主题切换
│   ├── hooks/             # 自定义Hooks
│   ├── types/             # TypeScript类型
│   ├── utils/             # 工具函数
│   └── App.tsx           # 主应用组件
├── public/                # 静态资源
├── deploy/                # 部署配置
└── docs/                  # 项目文档
```

## 🛠️ 技术栈

### 前端框架
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### 样式和UI
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **响应式设计** - 移动端适配

### 数据处理
- **SheetJS (xlsx)** - Excel文件处理
- **本地存储** - 数据持久化

### 部署
- **Docker** - 容器化部署
- **Netlify** - 静态网站托管
- **Nginx** - Web服务器

## 📖 使用指南

### 1. 准备Excel文件
确保您的Excel文件包含以下列：
- 题目 (必填)
- 选项A, B, C, D (必填)
- 正确答案 (必填)
- 解析 (可选)

### 2. 上传文件
1. 点击"选择文件"按钮
2. 选择您的Excel文件
3. 系统会自动识别工作表

### 3. 配置映射
1. 选择包含题目的工作表
2. 映射表头字段
3. 设置测验参数

### 4. 开始测验
1. 选择测验模式
2. 调整设置参数
3. 开始答题

## 🎯 测验模式说明

### 练习模式
- 实时显示正确答案
- 可随时查看解析
- 适合学习和复习

### 考试模式
- 模拟真实考试环境
- 计时功能
- 提交后显示结果

### 背诵模式
- 隐藏选项
- 专注于记忆
- 适合知识巩固

### 随机模式
- 题目随机排序
- 选项随机排列
- 增加测验难度

## 🔧 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 使用 Prettier 格式化代码

### 组件开发
```typescript
import React from 'react';

interface ComponentProps {
  // 定义Props类型
}

export const ComponentName: React.FC<ComponentProps> = ({ 
  // 组件实现
}) => {
  return (
    // JSX结构
  );
};
```

### 工具函数
```typescript
/**
 * 函数描述
 * @param param 参数描述
 * @returns 返回值描述
 */
export const functionName = (param: Type): ReturnType => {
  // 函数实现
};
```

## 🚀 部署

### Docker部署
```bash
# 构建镜像
docker build -f deploy/Dockerfile -t quiz-app .

# 运行容器
docker run -p 80:80 quiz-app
```

### Netlify部署
1. 连接GitHub仓库
2. 设置构建命令: `npm run build`
3. 设置发布目录: `dist`
4. 自动部署

### 手动部署
```bash
# 构建项目
npm run build

# 上传dist目录到Web服务器
```

## 📊 性能优化

### 代码分割
- 按路由分割代码
- 懒加载组件
- 优化首屏加载

### 资源优化
- 图片压缩和优化
- CSS和JS压缩
- CDN加速

### 缓存策略
- 浏览器缓存
- 本地存储
- 离线支持

## 🤝 贡献指南

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 提交规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [SheetJS](https://sheetjs.com/) - Excel处理库
- [Lucide](https://lucide.dev/) - 图标库

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](../../issues)
- 发送邮件至: [your-email@example.com]
- 项目主页: [项目地址]

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！ 