# 友链自助申请功能 - 配置指南

## 功能概述

访客在 `/links` 页面填写表单提交友链申请 → Vercel Serverless Function 自动创建 GitHub Issue → 你在 GitHub 给 Issue 加 `approved` 标签审核通过 → GitHub Action 自动将友链写入 `source/_data/links.yml` 并提交 → Vercel 检测到 push 自动重新部署。

## 文件清单

| 文件 | 用途 |
|------|------|
| `source/_data/links.yml` | 友链数据文件（自动维护） |
| `source/links/index.md` | 友链页面内容（规则说明） |
| `themes/aero/layout/links.ejs` | 友链页模板（渲染数据 + 表单） |
| `themes/aero/source/js/links.js` | 表单提交处理脚本 |
| `themes/aero/source/css/_partial/_links.scss` | 友链页样式 |
| `api/submit-link.js` | Vercel Serverless Function |
| `.github/workflows/approve-link.yml` | GitHub Action 审核工作流 |
| `.github/scripts/approve-link.mjs` | Action 解析脚本 |

## 配置步骤

### 第 1 步：创建 GitHub Personal Access Token

1. 打开 https://github.com/settings/tokens?type=beta （Fine-grained tokens）
2. 点击 **Generate new token**
3. 设置：
   - **Token name**: `friend-link-bot`
   - **Expiration**: 按需选择（建议 1 年）
   - **Repository access**: 选 **Only select repositories** → 选择 `Winn9910/suoma-blog.github.io`
   - **Permissions** → Repository permissions:
     - **Issues**: Read and write
     - 其他保持默认（No access）
4. 点击 **Generate token**
5. **复制 token**（只显示一次！）

### 第 2 步：在 Vercel 配置环境变量

1. 打开 Vercel 项目 → Settings → Environment Variables
2. 添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `GITHUB_TOKEN` | `github_pat_xxxx...` | 第 1 步复制的 Token |
| `GITHUB_REPO_OWNER` | `Winn9910` | GitHub 用户名（可选，已有默认值） |
| `GITHUB_REPO_NAME` | `suoma-blog.github.io` | 仓库名（可选，已有默认值） |

3. 确保环境变量应用于 **Production** 和 **Preview** 环境

### 第 3 步：提交代码到 GitHub

```bash
cd G:\suoma-blog
git add -A
git commit -m "feat: add self-service friend link submission"
git push origin main
```

push 后 Vercel 会自动触发重新部署。

### 第 4 步：测试

1. 访问 `https://www.suo.ma/links/`
2. 在底部表单填写测试数据并提交
3. 到 GitHub 仓库的 Issues 页面查看新建的 Issue
4. 给 Issue 添加 `approved` 标签
5. GitHub Actions 会自动触发，将友链写入 `links.yml` 并 push
6. Vercel 检测到 push 后重新构建，1-2 分钟后页面更新

## 审核流程

- **通过**：在 Issue 页面添加 `approved` 标签 → 自动添加友链并关闭 Issue
- **拒绝**：直接关闭 Issue 即可，不做任何操作

## 技术说明

- **PJAX 兼容**：表单脚本使用 `document` 级事件委托，PJAX 导航后仍正常工作
- **反垃圾**：表单含 honeypot 隐藏字段，机器人填写后提交会被拦截
- **安全**：GitHub Token 仅存在 Vercel 环境变量中，前端不可见
- **Labels 自动创建**：首次提交时自动创建 `friend-link`、`pending-review`、`approved` 三个标签
