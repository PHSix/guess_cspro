# 弗一把 - CS职业选手猜猜猜

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff.svg)
![pnpm](https://img.shields.io/badge/pnpm-Monorepo-ff8800.svg)

一个基于 React + TypeScript 开发的 CS:GO/CS2 职业选手猜谜游戏。通过对比选手的各种属性（队伍、国家、年龄、Major 参赛次数、角色），在限定次数内猜出随机选中的职业选手。

**支持单人和在线多人（最多3人）游戏模式！**

## 🎮 在线体验

**🌐 [https://guess-cspro.vercel.app/](https://guess-cspro.vercel.app/)**

**🌐 [https://guess-cspro.chenyi-ph.workers.dev/](https://guess-cspro.chenyi-ph.workers.dev/)**

> ⚠️ 国内访问可能需要使用"魔法"（VPN/代理）

## ✨ 功能特性

### 单人模式

- 🎯 **多种游戏模式**
  - ALL 模式：困难模式，包含所有职业选手
  - Normal 模式：中等难度，精选知名选手
  - YLG 模式：简单模式（即将推出）

- 📱 **响应式设计**
  - 桌面端优化布局
  - 移动端适配，横向滚动历史记录
  - PWA 支持，可安装到桌面

- 🔍 **智能搜索**
  - 模糊搜索选手姓名
  - 键盘导航支持（↑↓/Tab/Enter）
  - 实时搜索建议

- 🎨 **视觉反馈**
  - 属性对比结果可视化
  - 精确匹配、近似匹配、错误匹配
  - 霓虹赛博朋克主题风格

- ⚙️ **自定义设置**
  - 调整猜测次数（1-20次）
  - 游戏难度切换
  - 设置自动保存

### 在线多人模式 (NEW! ⭐)

- 👥 **实时多人对战**
  - 最多 3 人同房间竞技
  - SSE 实时通信，低延迟同步
  - 房主可随时开始游戏

- 🏆 **竞技机制**
  - 同时猜测神秘选手
  - 实时查看其他玩家结果
  - 先猜中者获胜

- 🔒 **类型安全**
  - 前后端共享 TypeScript 类型
  - Zod 运行时验证
  - 强类型 API 广播

## 🛠️ 技术栈

### 整体架构

- **包管理**: pnpm Monorepo
- **语言**: TypeScript 5.9.3
- **类型验证**: Zod 3.x

### 前端 (`app/`)

- **框架**: React 19.2.1
- **构建工具**: Vite 7.1.7
- **路由**: Wouter
- **UI 组件**: Radix UI + shadcn/ui
- **样式**: Tailwind CSS 4.1.14
- **状态管理**: Zustand
- **PWA**: VitePWA
- **图标**: Lucide React

### 后端 (`service/`)

- **运行时**: Node.js 18+
- **框架**: Hono.js + @hono/node-server
- **通信**: SSE (Server-Sent Events)
- **验证**: Zod

### 共享代码 (`shared/`)

- **游戏逻辑**: compareGuess, searchPlayers
- **类型定义**: API types, SSE event types
- **工具函数**: countryUtils, 常量

### 数据爬虫 (`hltv_data_scraper/`)

- **工具**: Puppeteer + puppeteer-extra
- **反检测**: stealth 插件

## 🚀 快速开始

### 环境要求

- Node.js 18+ (推荐使用最新 LTS 版本)
- pnpm 9.x

### 安装依赖

```bash
# 安装项目依赖（所有工作空间）
pnpm install
```

### 开发模式

```bash
# 启动前端开发服务器（端口 5173，代理 /api 到后端）
pnpm dev

# 或分别启动前端和后端
pnpm --filter @guess-cspro/service dev  # 后端 (端口 3001)
pnpm --filter @guess-cspro/app dev      # 前端 (端口 5173)
```

### 构建部署

```bash
# 构建所有工作空间
pnpm -r build

# 只构建前端
pnpm build:app

# 预览构建结果
pnpm preview
```

### 其他命令

```bash
# 在所有工作空间运行类型检查
pnpm -r check

# 爬虫：获取 HLTV 数据
pnpm --filter @guess-cspro/hltv_data_scraper fetch
```

## 📁 Monorepo 结构

```
guess_cspro/
├── app/                   # React 前端应用
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面路由
│   │   │   ├── HomePage.tsx         # 单人模式首页
│   │   │   ├── GamePage.tsx          # 游戏页面
│   │   │   ├── OnlineHomePage.tsx    # 在线模式首页
│   │   │   └── OnlineRoomPage.tsx    # 在线游戏房间
│   │   ├── lib/           # 核心逻辑
│   │   ├── store/         # Zustand 状态管理
│   │   ├── hooks/         # 自定义 Hooks (useSSEConnection)
│   │   ├── config/        # 配置文件 (API proxy)
│   │   └── types/         # 类型定义
│   ├── public/            # 静态资源 (JSON 数据)
│   └── README.md          # 前端说明文档
│
├── service/               # 在线多人后端服务
│   ├── src/
│   │   ├── managers/      # RoomManager, SessionManager
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   ├── utils/         # 验证、日志工具
│   │   ├── data/          # 玩家数据 JSON
│   │   └── index.ts       # 服务入口
│   └── README.md          # 后端说明文档
│
├── shared/                # 前后端共享代码
│   ├── gameEngine.ts      # 游戏核心逻辑 (compareGuess)
│   ├── api.ts             # API 类型定义
│   ├── sse.ts             # SSE 事件类型 + Zod 验证
│   ├── const.ts           # 共享常量
│   ├── countryUtils.ts    # 国家工具
│   ├── data/              # 共享数据文件
│   └── README.md          # 共享代码说明文档
│
├── hltv_data_scraper/     # HLTV 数据爬虫
│   ├── src/               # 爬虫源码
│   ├── out/               # 输出数据
│   └── README.md          # 爬虫说明文档
│
├── pnpm-workspace.yaml    # pnpm 工作空间配置
├── tsconfig.base.json     # 基础 TypeScript 配置
├── CLAUDE.md              # 开发者文档
└── README.md              # 项目总览 (本文件)
```

## 📦 工作空间说明

### [app/](./app/README.md) - 前端应用

React 单页应用，提供单人模式和在线多人模式的用户界面。

- **单人模式**: 完整的游戏流程（开始、游戏、结算）
- **在线模式**: 房间创建、加入、实时游戏、结果展示

### [service/](./service/README.md) - 后端服务

在线多人模式的后端服务。

- **房间管理**: 创建、加入、删除房间
- **会话管理**: SSE 连接生命周期
- **实时广播**: 游戏状态、猜测结果
- **类型安全**: 共享 TypeScript 类型和 Zod 验证

### [shared/](./shared/README.md) - 共享代码

前后端共享的类型、工具和游戏逻辑。

- **游戏逻辑**: `compareGuess()`、`searchPlayers()` 等
- **类型定义**: API 请求/响应、SSE 事件
- **验证模式**: Zod schemas

### [hltv_data_scraper/](./hltv_data_scraper/README.md) - 数据爬虫

从 HLTV.org 获取最新职业选手数据。

- **Puppeteer**: 自动化浏览器操作
- **数据导出**: JSON 格式输出
- **模式同步**: 支持不同难度模式

## 🎮 游戏规则

1. **目标**: 在限定次数内猜出随机选中的 CS:GO/CS2 职业选手
2. **属性对比**:
   - 🏢 **队伍**: 精确 ✓ 或不同 ✗
   - 🌍 **国家**: 精确 ✓、同赛区 ≈ 或不同 ✗
   - 👶 **年龄**: 精确 ✓、接近 ±2 岁 ↑/↓ 或不同 ✗
   - 🏆 **Major**: 精确 ✓、接近 ±3 次 ↑/↓ 或不同 ✗
   - 🔫 **角色**: 精确 ✓ 或不同 ✗

3. **在线模式**:
   - 房主可随时开始游戏（无需等所有人 Ready）
   - 非房主显示准备状态
   - 先猜中者获胜

## 📦 部署

### 前端部署

应用可部署到任何静态托管服务：

- [Vercel](https://vercel.com) (推荐)
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- GitHub Pages

```bash
# 构建
pnpm build:app

# 将 app/dist/ 目录上传即可
```

### 后端部署

后端需要 Node.js 运行环境：

```bash
# 构建
pnpm --filter @guess-cspro/service build

# 启动
PORT=3001 node service/dist/index.js

# 或使用 pm2
pm2 start service/dist/index.js --name guess-cspro-service
```

**注意**: 前端需配置 API 代理或直接连接后端服务器。

## 🤝 致谢

### 灵感来源

本项目的灵感来源于 [bai-piao/GuessCSPRO](https://github.com/bai-piao/GuessCSPRO) 项目，特别感谢该作者提供的创意和思路。

### 爬虫代码

项目的 `hltv_data_scraper` 模块部分代码参考了 [GuessCSPRO](https://github.com/bai-piao/GuessCSPRO) 项目，在此特别感谢原作者的贡献。

### AI 工具

本项目使用 **Claude Code** 工具和 **Minimax 的 M2 模型** 进行开发，包括：

- 代码架构设计
- 功能模块开发
- 问题排查与优化
- 文档编写

感谢 Anthropic 和 MiniMax 提供的 AI 编程工具！

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源协议。

## 💡 贡献

欢迎提交 Issue 和 Pull Request！

**详细文档请查看各工作空间的 README:**

- [app/README.md](./app/README.md) - 前端应用
- [service/README.md](./service/README.md) - 后端服务
- [shared/README.md](./shared/README.md) - 共享代码
- [hltv_data_scraper/README.md](./hltv_data_scraper/README.md) - 数据爬虫

**Enjoy the game! 🎮✨**
