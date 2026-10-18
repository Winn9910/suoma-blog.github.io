'use strict';

// 构建期抓取 gov.box 说说（Fediverse RSS），注入模板变量 moments
// 用法：模板中 moments.forEach(...)，无数据时模板自动隐藏

const FEED_URL = 'https://gov.box/admin.rss';
// 默认只展示最新 1 条；本地调试可用 MOMENTS_LIMIT=4 临时多显示几条
const LIMIT = parseInt(process.env.MOMENTS_LIMIT || '1', 10) || 1;
const MAX_IMAGES = 4;

let moments = [];
let loaded = false;

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(parseInt(d, 10)); })
    .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function toPlain(html) {
  return decodeEntities(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// 从 description 里抽出图片地址（snac 把附件放在 .snac-content-attachments 的 figure > img）
function pickImages(html) {
  const imgs = [];
  const re = /<img[^>]+src=["']?([^"'\s>]+)/gi;
  const decoded = decodeEntities(html);
  let m;
  while ((m = re.exec(decoded)) !== null && imgs.length < MAX_IMAGES) {
    const src = m[1].trim();
    if (/^https?:\/\//i.test(src) && imgs.indexOf(src) === -1) imgs.push(src);
  }
  return imgs;
}

function formatDate(pub) {
  const d = new Date(pub);
  if (isNaN(d.getTime())) return '';
  // 统一按北京时间（UTC+8）显示，避免构建机时区差异
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const p = function (n) { return (n < 10 ? '0' : '') + n; };
  return p(bj.getUTCMonth() + 1) + '-' + p(bj.getUTCDate()) + ' ' + p(bj.getUTCHours()) + ':' + p(bj.getUTCMinutes());
}

function parseFeed(xml) {
  const out = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    function pick(tag) {
      const m = item.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
      return m ? m[1] : '';
    }
    const desc = pick('description');
    const images = pickImages(desc);
    const text = toPlain(desc) || toPlain(pick('title'));
    const url = decodeEntities(pick('link')).trim();
    if ((!text && !images.length) || !url) continue;

    const moment = {
      text: text.length > 70 ? text.slice(0, 70) + '…' : text,
      url: url,
      date: formatDate(pick('pubDate'))
    };
    if (images.length) moment.images = images;

    out.push(moment);
    if (out.length >= LIMIT) break;
  }
  return out;
}

hexo.extend.filter.register('before_generate', async function () {
  if (loaded) return;
  loaded = true;
  try {
    const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'suoma-blog/1.0' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    moments = parseFeed(await res.text());
    hexo.log.info('已获取说说 ' + moments.length + ' 条');
  } catch (e) {
    hexo.log.warn('说说获取失败（挂件将隐藏）：' + e.message);
    moments = [];
  }
});

hexo.extend.filter.register('template_locals', function (locals) {
  locals.moments = moments;
  return locals;
});
