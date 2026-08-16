# win7 — a Windows 7 (Aero) Hexo theme

A Hexo theme built on [7.css](https://khang-nd.github.io/7.css) (MIT). The whole
site lives inside one Aero‑glass window, and a broad set of 7.css widgets are
woven into the real UI — not just decoration.

## Features

- **Aero glass window** with a title bar (minimize / maximize / **close→home**),
  tinted by a single `--w7-w-bg` color variable.
- **Explorer sidebar** built from 7.css `tree-view` + `group`/`fieldset` widgets
  (navigation, recent posts, tag cloud, categories).
- **Reading‑progress bar** on posts — native 7.css `[role=progressbar]` (green fill).
- **Code blocks** are wrapped in 7.css `.window` "Notepad" windows with a **Copy**
  button that copies **code only (no line numbers)** and a console‑style hljs palette.
- **Win7 context menu** (right‑click) — native 7.css `[role=menu]`: back to top /
  refresh / copy link / about.
- **Home page tabs** — 7.css `[role=tablist]` switching Latest / Tags / Categories.
- **Archive page** — 7.css `select` (combobox) year filter + `list-view`
  (`[role=listbox]`/`[role=option]`).
- **Post page** — Explorer `address-bar` breadcrumb + a `details`/`summary` ("reveal")
  info card.
- **About page** — 7.css `radio` theme‑color swatches (live window tint) + `command-link` links.
- **Sidebar display settings** — 7.css `slider` (font size) + `checkbox` (line numbers),
  both persisted in `localStorage`.
- **Footer command-links** (back home / back to top / RSS) on every page.
- **Status bar** with post count + RSS.
- **Responsive** — single column on narrow screens.

> No client‑side search is bundled (the search dialog was removed). If you want
> search, install `hexo-generator-search` (or `hexo-generator-feed` for RSS) and
> wire a box into `layout/partial/sidebar.ejs`.

## Install

1. Copy this folder (rename it `win7`) into your blog's `themes/`.
2. In your site `_config.yml` set `theme: win7`.
3. Optional — RSS status‑bar link: install `hexo-generator-feed` and set
   `win7.rss: /atom.xml` (or any feed path) in your site config.
4. `hexo clean && hexo g && hexo s`.

## Configure (`win7/_config.yml`)

| Key | Meaning |
| --- | --- |
| `window_color` | Aero window tint, any CSS color (default `#4580c4`). |
| `wallpaper` | `aurora` (Win7‑like) or `solid`. |
| `menu` | Sidebar nav entries (falls back to site `menu`). |
| `widgets` | Sidebar blocks: `nav`, `recent_posts`, `tagcloud`, `categories`. |
| `recent_posts_count` | How many recent posts to show. |
| `post_meta` | Show date/category line under titles. |
| `rss` | Feed URL for the status bar + footer (e.g. `/atom.xml`); `false` to hide. |
| `copyright` | Right side text of the status bar. |
| `comments` | Raw HTML (Utterances/Disqus/Giscus) injected at the end of each post. |
| `title_bar_text` | Title‑bar caption (empty → site title). |

## Notes

- 7.css (v0.21.1) is bundled in `source/css/7.css` — fully offline, no CDN.
- 7.css ships **no JS**; all interactivity lives in `source/js/theme.js`.
- Components 7.css does not expose as classes (`address-bar`, `command-link`) are
  hand‑rolled to match the Win7 look.
