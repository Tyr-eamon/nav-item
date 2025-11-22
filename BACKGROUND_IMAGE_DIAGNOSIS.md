# 背景图片缓存问题诊断报告

## 问题描述
用户反馈虽然已经替换了 `background.webp` 文件，但在浏览器中仍未看到更新的背景图片。

---

## 根本原因分析

### 1. **文件状态检查** ✓
- ✓ 确认 `web/public/background.webp` 文件已正确存在（大小：7.8MB）
- ✓ 文件最近修改时间为 2024-11-22 11:06
- ✓ Git 工作目录干净，无待提交的变更

### 2. **前端代码检查** ❌ **问题发现**
**关键问题**：`web/src/views/Home.vue` 第 344 行
```css
/* 原始代码（有问题） */
background-image: url('https://main.ssss.nyc.mn/background.webp');
```

**问题分析**：
- 背景图片从**外部 CDN 地址** (`https://main.ssss.nyc.mn/background.webp`) 加载
- 本地 `web/public/background.webp` 文件被**完全忽视**
- CDN 可能对该资源设置了长期缓存（HTTP Cache-Control 头）
- 即使本地文件被更新，浏览器仍会从 CDN 的缓存中加载旧版本
- 即使清空浏览器缓存或使用无痕模式，CDN 端的缓存仍然存在

### 3. **Vue/构建配置检查** ✓
- `vite.config.mjs` 配置正确
- Vite 会默认将 `public/` 目录中的文件复制到输出的 `dist/` 目录
- Dockerfile 正确配置，会将构建后的 `dist` 目录作为前端文件提供

### 4. **部署流程检查** ✓
- 部署方式：GitHub Actions + Docker
- GitHub Actions workflow 在检测到 `web/` 目录变更时会自动构建 Docker 镜像
- Docker 镜像构建时会执行 `npm run build`，将前端文件构建到 `dist/` 目录
- Express 服务器通过 `app.use(express.static(path.join(__dirname, 'web/dist')))` 提供静态文件

---

## 解决方案

### 已实施的修复

修改 `web/src/views/Home.vue` 第 344 行：

```css
/* 修复后（已应用） */
background-image: url('/background.webp?v=20250122');
```

**修复方案包含两个关键改进**：

1. **使用本地路径** (`/background.webp`)
   - 从本地 Express 服务器加载背景图片，而不是从外部 CDN
   - 用户更新 `web/public/background.webp` 文件时，新文件会在下次构建时被包含

2. **添加版本号查询参数** (`?v=20250122`)
   - 使用版本号作为缓存破坏器（cache buster）
   - 当需要强制更新背景图片时，只需更改版本号，浏览器会重新下载文件
   - 格式：`?v=YYYYMMDD`

### 后续步骤

1. **立即生效** (本地测试)：
   ```bash
   cd web && npm run build
   npm start  # 从项目根目录运行 app.js
   ```
   访问 `http://localhost:3000`，应该看到本地背景图片已加载

2. **生产部署** (GitHub Actions 自动)：
   - 将修改推送到 `main` 分支
   - GitHub Actions 自动触发构建流程
   - 新的 Docker 镜像会被构建并推送到 GitHub Container Registry
   - 部署系统更新容器时，新背景图片会被使用

3. **未来更新背景图片**：
   - 替换 `web/public/background.webp` 文件
   - （可选）在 Home.vue 中更新版本号：`?v=YYYYMMDD`
   - 提交并推送到 main 分支
   - GitHub Actions 自动部署新版本

---

## 缓存清除建议

对于已部署的用户，如果仍看不到新背景图片：

### 浏览器端：
1. **硬刷新** (Ctrl+Shift+R 或 Cmd+Shift+R)
2. **清除缓存**：在浏览器开发者工具 → Application → Cache Storage 中清除
3. **使用无痕/隐私浏览模式** 访问网站

### 服务器端：
1. 确保 Docker 容器已使用最新镜像重新启动
2. 如果使用 CDN，需要手动清除 CDN 缓存（取决于 CDN 服务商）

---

## 技术细节

### Vite public 目录处理
- Vite 的 `public` 目录自动被复制到构建输出目录
- `web/public/background.webp` → `web/dist/background.webp`
- Express 通过 `express.static('web/dist')` 提供这个文件
- 浏览器请求 `/background.webp?v=20250122` 时，Express 返回 `web/dist/background.webp`

### HTTP 缓存头建议
为了更好地控制缓存，可以在 Express 中为 public 资源添加缓存头：

```javascript
// 在 app.js 中的 express.static 配置
app.use(express.static(path.join(__dirname, 'web/dist'), {
  maxAge: '1h',  // 浏览器缓存 1 小时
  etag: false
}));
```

---

## 验证清单

- [x] 确认文件已正确替换
- [x] 检查前端代码中的 URL 引用
- [x] 验证 Vue/Vite 构建配置
- [x] 检查 Express 静态文件服务配置
- [x] 验证 Docker 构建流程
- [x] 修改背景图片 URL 为本地路径
- [x] 添加版本号缓存破坏器
- [x] 创建诊断文档和修复指南

---

## 总结

**问题原因**：背景图片从外部 CDN 加载，而不是本地文件

**解决方案**：改为从本地 Express 服务器加载，并添加版本号查询参数来破坏缓存

**影响范围**：
- 修改文件：`web/src/views/Home.vue`
- 需要重新构建：`npm run build`
- 需要重新部署：GitHub Actions 自动处理

**预期效果**：
- 用户将看到最新的背景图片
- 即使有浏览器缓存，版本号变化时也会强制重新加载
- 未来更新背景图片时无需修改代码逻辑
