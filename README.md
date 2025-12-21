# 弗一把 - CS职业选手猜猜猜

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff.svg)

一个基于 React + TypeScript 开发的 CS:GO/CS2 职业选手猜谜游戏。通过对比选手的各种属性（队伍、国家、年龄、Major 参赛次数、角色），在限定次数内猜出随机选中的职业选手。

## 🎮 在线体验

**🌐 [https://guess-cspro.vercel.app/](https://guess-cspro.vercel.app/)**

**🌐 [https://guess-cspro.chenyi-ph.workers.dev/](https://guess-cspro.chenyi-ph.workers.dev/)**

> ⚠️ 国内访问可能需要使用"魔法"（VPN/代理）


## ✨ 功能特性

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

## 🛠️ 技术栈

- **前端框架**: React 19.2.1 + TypeScript 5.9.3
- **构建工具**: Vite 7.1.7
- **路由**: Wouter (轻量级路由)
- **UI 组件**: Radix UI + shadcn/ui
- **样式**: Tailwind CSS 4.1.14 (自定义霓虹主题)
- **状态管理**: React Hooks + localStorage
- **PWA**: VitePWA 插件
- **图标**: Lucide React
- **包管理器**: pnpm

## 🚀 快速开始

### 环境要求

- Node.js 18+ (推荐使用最新 LTS 版本)
- pnpm 9.x

### 安装依赖

```bash
# 安装项目依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 其他命令

```bash
# TypeScript 类型检查
pnpm check

# 代码格式化
pnpm format
```

## 📁 项目结构

```
guess_cspro/
├── client/                 # React 前端应用
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面路由
│   │   ├── lib/            # 核心逻辑 (gameEngine.ts)
│   │   ├── contexts/       # React Context
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── const.ts        # 常量定义
│   └── public/             # 静态资源
│       ├── *.json          # 选手数据文件
│       └── favicon.png
├── shared/                 # 共享代码
│   ├── types.ts           # 类型定义
│   ├── countryUtils.ts    # 国家工具
│   └── const.ts           # 共享常量
├── hltv_data_scraper/     # HLTV 数据爬虫
│   ├── src/               # 爬虫源码
│   ├── out/               # 输出数据
│   └── package.json       # 依赖配置
├── scripts/               # 工具脚本
├── dist/                  # 构建输出
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── README.md              # 项目说明
```

## 🎮 游戏规则

1. **目标**: 在限定次数内猜出随机选中的 CS:GO/CS2 职业选手
2. **属性对比**:
   - 🏢 **队伍**: 精确匹配显示 ✓，不同显示 ✗
   - 🌍 **国家**: 精确匹配显示 ✓，不同显示 ✗
   - 👶 **年龄**: 精确匹配显示 ✓，接近显示 ≈，相差较大显示 ↑/↓
   - 🏆 **Major**: 精确匹配显示 ✓，接近显示 ≈，相差较大显示 ↑/↓
   - 🔫 **角色**: 精确匹配显示 ✓，不同显示 ✗

3. **游戏模式**:
   - ALL: 包含所有职业选手，难度最高
   - Normal: 精选知名选手，难度中等
   - YLG: 即将推出，难度最低

## 🗂️ 数据管理

### 选手数据

项目使用 JSON 文件存储选手数据：

- `all_players_data.json` - 所有选手数据
- `normal_players_data.json` - 精选选手数据
- `ylg_players_data.json` - YLG 模式数据

### 数据爬虫

项目包含 HLTV 数据爬虫，用于获取最新的选手信息：

```bash
# 进入爬虫目录
cd hltv_data_scraper

# 安装依赖
pnpm install

# 获取选手数据
pnpm fetch

# 同步数据到不同模式
pnpm sync

# 应用修复补丁
pnpm patch
```

## 🎨 自定义主题

项目采用霓虹赛博朋克风格设计，支持：

- 🌑 深色主题（默认）
- ⚡ 霓虹边框效果
- 📺 复古 CRT 风格文字
- 🎭 故障艺术特效

如需修改主题，编辑 `client/src/index.css` 文件中的 CSS 自定义属性。

## 📦 部署

### Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fguess_cspro)

1. Fork 本项目
2. 在 Vercel 中导入项目
3. 自动部署完成

### 静态托管

```bash
# 构建项目
pnpm build

# 将 dist/ 目录上传到任意静态托管服务
# 如：Netlify、Cloudflare Pages、GitHub Pages 等
```

### Cloudflare Pages

正在开发 Cloudflare Pages 部署方案，敬请期待...

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

**Enjoy the game! 🎮✨**
