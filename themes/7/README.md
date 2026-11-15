# hexo-theme-win7

一个 **Windows 7 / Frutiger Aero** 玻璃拟态风格的 Hexo 主题。

把博客做成一个「Windows 资源管理器窗口」：Aero 玻璃标题栏、银色立体窗框、
资源管理器式的文章列表（名称 / 修改日期 / 摘要三列）、面包屑地址栏、自定义右键菜单、
可拖拽的音乐播放器与附件浮窗、全屏加载动画。

> 特点：**全站资源本地化**——CSS / JS / 图片 / 图标 / 字体 / MathJax / 代码高亮
> 全部内置，不请求任何外部 CDN，国内访问无超时。
> （唯一的可选外部依赖是 Twikoo 评论后端，需你自己部署，见下文；不配则不出现评论。）

---

## 一、环境要求

- Node.js 18+（建议 20）
- Hexo 7.x

---

## 二、安装步骤

### 1. 放入主题
把整个 `win7` 文件夹放到你的博客的 `themes/` 目录下，即 `themes/win7/`。

### 2. 安装依赖插件（重要！不装会构建报错）
本主题用到以下 Hexo 插件，在博客根目录执行：

```bash
npm install hexo-abbrlink hexo-generator-tag hexo-generator-feed hexo-generator-sitemap hexo-renderer-ejs --save
```

说明：
- `hexo-renderer-ejs` —— 模板引擎（主题模板是 EJS，必装）
- `hexo-abbrlink` —— 文章短链改成纯数字 ID（可选，但配置里默认用到，见第 3 步）
- `hexo-generator-tag` —— 标签页
- `hexo-generator-feed` —— RSS/Atom 订阅
- `hexo-generator-sitemap` —— 站点地图
（`hexo-generator-index` / `hexo-generator-archive` 是 Hexo 自带，无需单独装。）

### 3. 修改站点根目录 `_config.yml`
（注意：YAML 里冒号后面必须有空格）

```yaml
# 启用主题
theme: win7

# 代码高亮（让 hljs 样式生效）
highlight:
  enable: true
  hljs: true

# 文章短链：纯数字 ID + .html（如 /12345.html）。不想要可删掉这两段，改回默认 permalink
permalink: :abbrlink.html
abbrlink:
  alg: crc32
  rep: dec

# RSS 订阅（生成静态 atom.xml，无外部请求）
feed:
  type: atom
  path: atom.xml
  limit: 20
  content: true

# 站点地图（把 url 改成你的真实域名才准确）
sitemap:
  path: sitemap.xml
```

### 4. 配置主题
主题自带 `themes/win7/_config.yml`（已是脱敏默认值，可直接跑）。
按需修改里面的头像、社交链接、音乐、评论、备案号等。每一项都有中文注释。
同目录的 `_config.landscape.yml` 是一份**带演示数据的中文示例样本**，
不确定某项怎么填时，照着它抄进 `_config.yml` 即可（该样本文件本身不参与构建）。

### 5. 生成预览

```bash
hexo clean && hexo generate && hexo server
```

打开 http://localhost:4000 查看。

---

## 三、需要手动创建的入口页面（否则对应页面 404）

主题提供了这些页面的模板，但需要你在 `source/` 下建入口文件才会生成：

**标签云页 `/tags/`** —— 新建 `source/tags/index.md`：
```markdown
---
title: 标签
type: tags
layout: tags
comments: false
---
```

**友情链接页 `/links/`** —— 新建 `source/links/index.md`：
```markdown
---
title: 友情链接
layout: links
comments: false
---
```
（友链数据在 `themes/win7/_config.yml` 的 `friends` 段里填。）

**关于页 `/about/`** —— 新建 `source/about/index.md`：
```markdown
---
title: 关于
layout: about
comments: false
---
这里写你的自我介绍。
```

**404 页** —— 主题已内置，无需操作（`404.html` 会自动生成）。
归档页 `/archives/` 由 Hexo 自动生成，无需建入口。

---

## 四、主题配置项速览（themes/win7/_config.yml）

| 配置段 | 说明 |
|---|---|
| `menu` | 导航项 |
| `comments` | 文章评论（Twikoo）。`enable: false` 一键关闭；单篇 front-matter `comments: false` 可单独关 |
| `favicon` | 站点图标 |
| `profile` | 左侧栏头像 / 昵称 / 社交链接（`avatar` 放纯头像方图，勿自带边框，相框由主题自动叠加） |
| `friends` | 友情链接页数据 + Twikoo 申请区 |
| `music` | 顶部音乐播放器。`songs[0].url` 为空则不显示播放器 |
| `attachments.max` | 附件浮窗最多显示条数 |
| `math` | 数学公式（MathJax 本地，已内置） |
| `hljs` | 代码高亮样式开关 |
| `beian` | 页脚备案号（仅中国大陆站点需要，留空不显示） |

关掉任意组件，把对应 `enable` 改 `false` 即可，不用删代码。

---

## 五、写文章时的可选 front-matter

```markdown
---
title: 文章标题
date: 2026-01-01 12:00:00
tags: [标签1, 标签2]
cover: /images/xxx.webp     # 列表页封面图（不填则按标题哈希自动选一个图标）
mathjax: true               # 本文需要数学公式时才写（$...$ 行内，$$...$$ 块级）
comments: false             # 单独关闭本文评论（可选）
attachments:                # 本文附件（会汇总到附件浮窗，可选）
  - name: 文件.zip
    url: /uploads/file.zip
    size: 1.2 MB
---
```

---

## 六、评论系统（Twikoo，可选）

主题已内置评论前端 `source/vendor/twikoo.min.js`，但**评论后端需你自己部署**
（否则页面不显示评论）：

1. 部署一个 Twikoo 后端（腾讯云 CloudBase / Vercel / 自建 Docker，见 Twikoo 官方文档）；
2. 把后端地址填到 `themes/win7/_config.yml`：
   - 文章评论：`comments.twikoo.env_id`
   - 友链申请：`friends.apply.twikoo.env_id`
   （两处可用同一个后端。）

不部署也不影响其它功能，只是没有评论区。

---

## 七、音乐播放器放音频

把音频文件（如 `song.mp3`）放到 `themes/win7/source/mp3/`，
然后在主题 `_config.yml` 的 `music.songs[0].url` 填 `/mp3/song.mp3`。
（本包未附带任何音频，避免版权问题。）

---

## 八、数学公式

本地 MathJax 已内置在 `source/vendor/mathjax/`，零外部请求。
在需要公式的文章 front-matter 写 `mathjax: true` 即可。
行内 `$...$`，块级 `$$...$$`。

---

## 九、部署

`hexo generate` 生成的 `public/` 是纯静态站，可部署到任意静态托管
（GitHub Pages / Gitee Pages / Vercel / EdgeOne Pages / 自建 Nginx 等）。
建议开启 HTTP/2 以获得更好的加载速度。

---

## 十、许可

MIT。图标与 7.css 等第三方资产版权归各自作者所有。
