'use strict';

// 构建期抓取 gov.box 说说（Fediverse RSS），注入模板变量 moments
// 用法：模板中 moments.forEach(...)，无数据时模板自动隐藏

const FEED_URL = 'https://gov.box/admin.rss';
const LIMIT = 1;

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
    const text = toPlain(pick('description')) || toPlain(pick('title'));
    const url = decodeEntities(pick('link')).trim();
    if (!text || !url) continue;

    out.push({
      text: text.length > 70 ? text.slice(0, 70) + '…' : text,
      url: url,
      date: formatDate(pick('pubDate'))
    });
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
