# HINGE TYPE / 掀起错视字体实验

一个用于字体设计实验的单页网站。字母被切成固定面与活动面，活动面从左侧或右侧铰接，通过透视压缩、错位和投影形成“从平面掀起”的视觉错觉。

## 功能

- 输入任意英文单词，实时生成错视字体
- 单词海报与 A–Z 字母矩阵两种视图
- 调节掀起角度、切口位置、阴影、字距和动画速度
- 左侧铰链 / 右侧铰链切换
- 静态 PNG 导出
- 4 秒 WebM 动效录制

## 本地运行

```bash
npm install
npm run dev
```

## 导入 Google AI Studio

将本项目全部文件放在 GitHub 仓库根目录，确保 `package.json` 与 `src` 直接可见。然后在 Google AI Studio 的 Build 页面点击输入框左下角 `+`，选择 `Import from GitHub`。
