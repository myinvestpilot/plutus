# 策引文档库

策引平台官方文档网站。

:::note 关于策引
策引为个人开发的投资策略分析工具，仅供学习研究使用，不构成投资建议。
:::

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm start
```

此命令启动本地开发服务器并打开浏览器窗口。大部分修改会实时反映，无需重启服务器。

### 构建

```bash
npm run build
```

此命令将静态内容生成到 `build` 目录，可以使用任何静态内容托管服务进行部署。

### 本地预览构建结果

```bash
npm run serve
```

此命令可以在本地预览构建后的静态网站。

## 项目结构

```
docs/
├── intro.md                      # 文档首页
├── concepts/                     # 核心概念
│   ├── ai-agent.md              # AI智能体
│   ├── background.md            # 背景与理念
│   ├── overview.md              # 平台概述
│   └── risk-analysis.md         # 风险分析
├── guides/                       # 使用指南
│   ├── create-portfolio.md      # 创建投资组合
│   ├── email-notifications.md   # 邮件通知
│   ├── frequently-asked-questions.md # 常见问题
│   ├── official-portfolios.md   # 官方模拟组合展示
│   └── portfolio-analysis.md    # 组合分析
├── primitives/                   # 原语组件系统
│   ├── advanced/                # 高级功能
│   │   ├── architecture-limitations.md # 架构限制
│   │   ├── market-indicators.md # 市场指标
│   │   ├── optimization.md     # 策略优化
│   │   ├── stock-bond-rotation-case.md # 股债轮动案例
│   │   └── troubleshooting.md  # 故障排除指南
│   ├── architecture.md         # 架构概述
│   ├── composition.md          # 组件组合
│   ├── examples.md             # 示例
│   ├── getting-started.md      # 入门指南
│   ├── indicators.md           # 指标组件
│   ├── signals.md              # 信号组件
│   └── troubleshooting.md      # 基础故障排除
└── strategies/                   # 投资策略详解
    ├── basic-concepts.md        # 基础概念
    ├── bollinger-bands.md      # 布林带策略
    ├── buy-and-hold.md         # 买入持有策略
    ├── chandelier-exit.md      # 吊灯止损策略
    ├── dual-moving-average.md  # 双均线策略
    ├── macd-strategy.md        # MACD策略
    └── momentum-rotation.md    # 动量轮动策略
```

## 文档内容概览

### 📖 核心概念
- **平台概述**：策引平台的核心功能和定位
- **AI智能体**：智能投资分析助手的工作原理
- **背景与理念**：平台创建的背景和设计理念
- **风险分析**：投资风险评估和管理方法

### 🛠️ 使用指南
- **创建投资组合**：如何创建和配置投资组合
- **组合分析**：深度分析投资组合表现
- **官方模拟组合**：四种策略在三大市场的应用展示
- **邮件通知**：设置交易信号提醒
- **常见问题**：用户常遇到的问题和解答

### ⚙️ 原语组件系统
- **架构设计**：系统架构和设计原理
- **组件类型**：指标组件和信号组件详解
- **组合方式**：如何组合不同组件构建策略
- **高级功能**：市场指标、策略优化、故障排除

### 📈 投资策略详解
- **买入持有策略**：长期投资的经典策略
- **双均线策略**：基于移动平均线的趋势跟踪
- **MACD策略**：基于MACD指标的交易策略
- **布林带策略**：基于统计学的价格通道策略
- **吊灯止损策略**：动态止损的趋势跟踪策略
- **动量轮动策略**：基于动量的资产轮动策略

## 技术特性

- **🌐 多语言支持**：中文界面和内容
- **📱 响应式设计**：支持桌面和移动设备
- **🔍 全文搜索**：快速查找文档内容
- **🎨 现代化UI**：基于Docusaurus 3.0的现代界面
- **⚡ 快速加载**：静态网站生成，加载速度快
- **🔗 自动导航**：自动生成侧边栏和面包屑导航

## 部署

### 部署到 Cloudflare Pages

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
   - **Node.js 版本**: 18.x 或更高

### 其他部署选项

- **Vercel**: 支持自动部署和预览
- **Netlify**: 支持表单处理和边缘函数
- **GitHub Pages**: 免费的静态网站托管
- **自托管**: 任何支持静态文件的服务器

## 开发指南

### 技术栈
- **框架**: Docusaurus 3.0
- **语言**: TypeScript
- **包管理器**: npm
- **样式**: CSS Modules + 自定义CSS
- **部署**: 静态网站生成

### 文档编写规范

1. **文件命名**：使用小写字母和连字符，如 `create-portfolio.md`
2. **标题层级**：合理使用H1-H6标题，保持层级清晰
3. **链接格式**：使用相对路径链接其他文档
4. **代码块**：使用适当的语言标识符高亮代码
5. **警告提示**：使用Docusaurus的警告组件增强可读性

### 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/new-content`
3. 提交更改：`git commit -m "Add new content"`
4. 推送分支：`git push origin feature/new-content`
5. 创建 Pull Request

## 相关链接

- **策引平台**: [https://www.myinvestpilot.com](https://www.myinvestpilot.com)

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
