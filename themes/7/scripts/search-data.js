/* win7 theme — 全站搜索数据生成器
 *
 * 构建时把全站文章汇总成一份静态 /search.json（标题 / 链接 / 摘要纯文本 / 标签 /
 * 发布日期），供前端搜索框跨全部文章（含分页之外的文章）实时匹配。
 * 纯静态文件、无外部请求，符合全站本地化约束。
 *
 * 关闭方式：站点 _config.yml 里写 search.enable: false 即可不生成。
 */
'use strict';

// 去掉 HTML 标签 + 折叠空白，得到可搜索的纯文本
function toPlainText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')      // 去标签
    .replace(/&[a-z#0-9]+;/gi, ' ') // 去 HTML 实体
    .replace(/\s+/g, ' ')          // 折叠空白
    .trim();
}

// 与 index.ejs 一致的图标选取：无封面文章按 path/title 哈希确定性选一个本地图标
var TOPIC_ICONS = [
  'android.webp', 'apple2001.webp', 'chat.webp', 'discord.webp', 'faq.webp',
  'globe.webp', 'graphics.webp', 'language.webp', 'music.webp', 'software.webp',
  'toolbox.webp', 'uidesign.webp', 'windows7-3.webp'
];
function pickIcon(key) {
  var h = 0, s = String(key || '');
  for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  return TOPIC_ICONS[h % TOPIC_ICONS.length];
}

hexo.extend.generator.register('search-data', function (locals) {
  const cfg = hexo.config.search || {};
  if (cfg.enable === false) return;

  const limitLen = typeof cfg.content_length === 'number' ? cfg.content_length : 12000;

  const posts = locals.posts.sort('-date').toArray().map(function (post) {
    const tags = post.tags && post.tags.length
      ? post.tags.map(function (t) { return t.name; })
      : [];

    // 正文纯文本（截断，避免 JSON 过大）；摘要单独保留一份用于列表展示
    const contentText = toPlainText(post.content).slice(0, limitLen);
    const excerptText = toPlainText(post.excerpt || post.content).slice(0, 140);
    const urlFor = hexo.extend.helper.get('url_for');
    const icon = post.cover
      ? urlFor.call(hexo, post.cover)
      : urlFor.call(hexo, '/image/icon/topic/' + pickIcon(post.path || post.title));

    return {
      title: post.title || '',
      url: urlFor.call(hexo, post.path),
      date: post.date ? post.date.format('YYYY-MM-DD') : '',
      icon: icon,
      tags: tags,
      excerpt: excerptText,
      content: contentText
    };
  });

  return {
    path: 'search.json',
    data: JSON.stringify(posts)
  };
});
