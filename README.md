# StatsViz Pro - 专业跨平台数据统计与可视化平台

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-lightgrey)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Electron](https://img.shields.io/badge/Electron-28.x-47848F)]()

一个基于 Electron 的跨平台数据统计与可视化分析工具，支持 Windows / macOS / Linux 桌面端，同时提供响应式网页版可在手机浏览器使用。

## ✨ 功能特性

- 📂 **CSV 数据导入** — 拖拽上传，自动识别数值列与分类列
- 📊 **8 种统计图表** — 直方图、箱线图、散点图、折线图、条形图、饼图、KDE 密度图、相关性热力图
- 📈 **12 项描述统计指标** — 均值、中位数、标准差、四分位数、偏度、峰度等自动计算
- 🐍 **Python 代码生成** — 每种图表自动生成对应 Python 分析代码，一键复制
- 🖼️ **图表导出** — 一键导出高清 PNG
- 🔒 **数据本地处理** — 数据不上传，隐私安全
- 📱 **响应式设计** — 适配桌面、平板、手机屏幕

## 🚀 快速开始

### 方式一：直接使用网页版（无需安装）
直接打开 `src/renderer/index.html` 即可在浏览器中使用。

> **离线使用说明**：默认通过 CDN 加载 ECharts 和 PapaParse 库。如需完全离线运行，请下载以下两个文件放到 `src/renderer/assets/` 目录，并修改 `index.html` 中的脚本引用路径：
> - echarts.min.js: https://unpkg.com/echarts@5.4.3/dist/echarts.min.js
> - papaparse.min.js: https://unpkg.com/papaparse@5.4.1/papaparse.min.js

### 方式二：本地开发（Electron 桌面端）
```bash
# 克隆仓库
git clone https://github.com/solosingle/statsviz-pro.git
cd statsviz-pro

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 打包 Windows 安装包
npm run build:win

# 打包 macOS 安装包
npm run build:mac

# 打包 Linux 安装包
npm run build:linux

# 打包全平台
npm run build:all
```

打包后的安装包会输出到 `release/` 目录。

### 方式三：直接下载安装包
前往 [Releases](https://github.com/solosingle/statsviz-pro/releases) 页面下载对应平台的安装包：
- Windows: `.exe` (NSIS 安装版 / 便携版)
- macOS: `.dmg`
- Linux: `.deb` / `.AppImage`

## 📁 项目结构

```
statsviz-pro/
├── src/
│   ├── main/              # Electron 主进程
│   │   └── main.js
│   └── renderer/          # 渲染进程（前端页面）
│       ├── index.html
│       ├── css/
│       │   └── style.css
│       ├── js/
│       │   └── app.js
│       └── assets/        # 静态资源目录（离线使用时存放第三方库）
├── build/                 # 打包图标等资源
├── docs/                  # 文档
├── release/              # 打包输出目录
├── package.json
├── LICENSE
└── README.md
```

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 28 |
| 前端 | 原生 HTML / CSS / JavaScript |
| 图表 | Apache ECharts 5 |
| CSV 解析 | PapaParse |
| 打包 | electron-builder |

## 📦 支持平台

- ✅ Windows 10 / 11 (x64)
- ✅ macOS 10.15+ (Intel / Apple Silicon)
- ✅ Linux (Ubuntu / Debian / Fedora)
- ✅ Web 浏览器 (Chrome / Firefox / Edge / Safari)
- ✅ 移动端浏览器（响应式适配）

## 📄 数据格式

CSV 文件第一行为列名，之后每行为一条数据记录，支持中文列名。

## 📄 License

[MIT](LICENSE)
