# 策引文档库

这个文档网站使用 [Docusaurus](https://docusaurus.io/) 构建，一个现代化的静态网站生成器。

## 安装依赖

```bash
npm install
```

## 本地开发

```bash
npm start
```

此命令启动本地开发服务器并打开浏览器窗口。大部分修改会实时反映，无需重启服务器。

## 构建

```bash
npm run build
```

此命令将静态内容生成到 `build` 目录，可以使用任何静态内容托管服务进行部署。

## 本地预览构建结果

```bash
npm run serve
```

此命令可以在本地预览构建后的静态网站。

## 部署到 Cloudflare Pages

1. 将代码推送到 GitHub：
```bash
git add .
git commit -m "Update documentation"
git push origin main
```

2. 在 Cloudflare Pages 中连接此仓库，配置如下：
   - **框架预设**: Docusaurus
   - **构建命令**: `npm run build`
   - **构建输出目录**: `build`

## 项目结构

```
docs/
├── 01-introduction.md            # 文档首页
├── 02-核心概念/                  # 核心概念说明
├── 03-使用指南/                  # 使用指南
├── 04-策略详解/                  # 策略详解
└── 05-开源电子书/                # 开源电子书
```

## 开发说明

- 本项目使用 TypeScript 和 npm 包管理器
- 支持中文界面和内容
- 自动生成侧边栏导航
- 支持响应式设计
