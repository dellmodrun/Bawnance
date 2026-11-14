# Vice City Markets 本地前端

这是 `https://vicecitymarkets.fun/` 前端的完整本地部署包，包含原站开场视频动画、首页、全部分类与详情路由、原始前端代码、图片和字体。

GitHub Pages：`https://dellmodrun.github.io/Bawnance/`

## 一键启动

双击 `启动网站.cmd`，浏览器会打开：

`http://127.0.0.1:4173`

也可以在本目录运行：

```powershell
npm start
```

## 说明

- 页面、脚本、样式、图片、字体和开场 MP4 均从本目录提供。
- 行情等服务端数据请求由本地服务转发到原站，因此动态数据与钱包相关功能仍需要联网。
- `npm run check` 可检查 50 个本地路由、应用入口、开场视频与关键资源是否齐全。
- `npm run refresh` 可重新同步原站当前前端（需要联网及本机 Chrome）。
- `npm run build:pages` 生成 GitHub Pages 静态发布包；Pages 保留原版视觉、开场视频和全部静态路由，但不运行钱包与实时交易后端。
