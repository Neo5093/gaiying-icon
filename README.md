# 该影 icon — 专业级跨平台图标设计工作站

纯浏览器运行的图标 / Logo 设计工具：零依赖、零构建、免注册，打开 HTML 即用。一次设计，一键导出 Android / iOS / Web / macOS / Windows 全平台资源包。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 功能一览

**内容源（6 种）**
- 图形：内置 64 个矢量图标 + Iconify 在线 2w+ 图标搜索（支持中文别名与翻译）
- 文本：多行 / 字重 / 字距 / 行高 / 弧形排布，支持 Google Fonts 动态加载
- Emoji：8 大分类全量选择器 + 关键词搜索
- 图片：上传 / 拖拽 / URL 加载，原图或单色化
- 品牌 Logo：simple-icons 常用品牌库
- 粘贴 SVG：直接粘贴 SVG 代码解析渲染

**图像调整**
- 亮度 / 对比度 / 饱和度 / 色温 / 色调（RGB 灰轴旋转，保饱和度算法）
- 单色 / 渐变着色，对比度实时检测（WCAG）

**造型设计**
- 11 种形状蒙版（Squircle / 圆角 / 圆形 / 六边形 / 星形 / 水滴 / 盾牌等）+ 自定义 SVG 蒙版
- 背景：纯色 / 线性 / 径向 / 锥形渐变 + 图案纹理 + 噪点 + 背景图
- 特效：四种阴影 / 描边 / 发光 / 光泽 / 内边框
- 8 套风格预设 + 随机灵感

**徽章 / 角标**
- 角标（ribbon）/ 底部横条（bar）/ 圆点（dot）三种样式
- 圆点内容：内置图形 / Iconify 在线图标 / Emoji / 上传图片
- 位置四宫格 + X/Y 平移微调 + 大小缩放

**预览与导出**
- 实时预览：Android（含 13 主题图标 / 通知栏）、iOS（含 18 深色 / App Store / 主屏幕）、Web（favicon / PWA / maskable / OG 分享图）、macOS、Windows
- 一键导出 ZIP：全平台 PNG 规格 + SVG 矢量 + ICO + ICNS + Web Manifest + adaptive-icon XML + 设计配置存档
- 撤销 / 重做（60 步）、本地自动保存、历史快照 30 条、URL 分享、中英双语、明暗双主题

## 🚀 使用

无需安装任何东西——直接用浏览器打开 `index.html`，或起个静态服务器：

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

然后访问 `http://localhost:8000`。

> 在线图标搜索（Iconify）与 Google Fonts 加载需要联网；其余功能完全离线可用。

## 🛠 技术

- **零依赖**：纯 HTML + CSS + 原生 JavaScript（ES2020），11 个 JS 模块按序加载，无框架无构建
- **渲染**：Canvas 2D 逐层管线（背景 → 内容 → 图像调整 → 特效 → 徽章），RAF 防抖
- **图像调整**：逐像素引擎（对比度 / 亮度 / 饱和度 / 色温 / RGB 灰轴色调旋转）
- **导出**：零依赖手写 ZipBuilder，SVG 导出对图标 / 文本保持矢量，位图内容以 PNG 嵌入
- **持久化**：localStorage 自动保存 + 深合并版本迁移，撤销栈防抖快照

```
qm-studio/
├── index.html          # 单页结构（面板 / 舞台 / 预览 / 导出条）
├── css/style.css       # 主题变量（明暗双主题）+ 组件样式
└── js/
    ├── i18n.js         # 中英双语 + Emoji 数据
    ├── icons.js        # 内置图标库（24×24 path）
    ├── shapes.js       # 形状蒙版路径
    ├── state.js        # 全局状态 / 撤销重做 / 历史 / 分享 / 预设
    ├── render.js       # Canvas 渲染引擎 + 图像调整引擎
    ├── zip.js          # 零依赖 ZIP 打包
    ├── export.js       # 全平台导出清单 + SVG 矢量导出
    ├── preview.js      # 平台预览渲染
    ├── panels.js       # 左侧面板绑定（含图标 / Emoji 选择器）
    ├── exportbar.js    # 底部导出条
    └── main.js         # 启动引导
```

## 🤝 二次开发

结构高度模块化：加一种形状改 `shapes.js`，加一个内置图标改 `icons.js`，加一种徽章样式改 `render.js` 的 `drawBadge`，加导出规格改 `export.js` 的平台清单。所有面板控件用 `bindSeg / bindRange / bindColor / bindCheck` 三行绑定，状态变更走 `onStateChange()` 统一入口。

## 📄 License

[MIT](LICENSE) © 2026 该影 (Neo5093)
