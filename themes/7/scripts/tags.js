/* win7 theme — 内嵌视频标签插件
 *
 * B站极简内嵌（作为“图床”，不引导到 B站）：
 *   {% bilibili bvid=BV1wbpZeSEPK aid=112977453911469 cid=500001652782644 %}
 *   可选参数：p=1 danmaku=0 autoplay=0
 *   使用 html5mobileplayer.html + hideCoverInfo=1&danmaku=0，隐藏播放量/默认关弹幕
 *
 * 抖音内嵌（自适应，手机竖版 / 电脑横版）：
 *   {% douyin vid=7458617091420114236 %}
 *   可选参数：autoplay=0
 */
'use strict';

// 把 "key=value key2=value2" 形式的参数数组解析成对象
function parseArgs(args) {
  const opts = { _: [] };
  args.forEach(function (a) {
    const idx = a.indexOf('=');
    if (idx > -1) {
      opts[a.slice(0, idx).trim()] = a.slice(idx + 1).trim();
    } else {
      // 无 = 的裸参数：收集为默认 id，交给各标签自己处理
      opts._.push(a.trim());
    }
  });
  return opts;
}

/* ---------------- Bilibili ---------------- */
hexo.extend.tag.register('bilibili', function (args) {
  const opts = parseArgs(args);
  const bvid = opts.bvid || (opts._ && opts._[0]) || '';
  const aid = opts.aid || '';
  const cid = opts.cid || '';
  const p = opts.p || '1';
  const danmaku = opts.danmaku != null ? opts.danmaku : '0';
  const autoplay = opts.autoplay != null ? opts.autoplay : '0';

  const params = [
    'isOutside=true',
    aid ? 'aid=' + aid : '',
    bvid ? 'bvid=' + bvid : '',
    cid ? 'cid=' + cid : '',
    'p=' + p,
    'hideCoverInfo=1',
    'danmaku=' + danmaku,
    'autoplay=' + autoplay
  ].filter(Boolean).join('&');

  const src = '//www.bilibili.com/blackboard/html5mobileplayer.html?' + params;

  return '<div class="video-embed bilibili-embed">' +
    '<iframe src="' + src + '" scrolling="no" border="0" frameborder="no" ' +
    'framespacing="0" allowfullscreen="true"></iframe></div>';
});

/* ---------------- 抖音 ----------------
 * {% douyin vid=xxx %}            手机竖版（默认，最稳）
 * {% douyin vid=xxx mode=mobile %} 同上
 * {% douyin vid=xxx mode=pc %}     电脑横版（需父容器 ≥730px，否则抖音强制回退竖版）
 *
 * 坑：抖音 iframe 在父级宽度 < 730px 时会强制手机竖版。
 * 本主题正文可用宽约 780px，足够出横版；pc 模式再给容器加 .douyin-pc
 * 让它铺满正文宽度以确保 ≥730px。
 */
hexo.extend.tag.register('douyin', function (args) {
  const opts = parseArgs(args);
  const vid = opts.vid || (opts._ && opts._[0]) || '';
  const autoplay = opts.autoplay != null ? opts.autoplay : '0';
  const isPc = (opts.mode || '').toLowerCase() === 'pc';

  const src = 'https://open.douyin.com/player/video?vid=' + vid + '&autoplay=' + autoplay;

  const cls = isPc ? 'douyin douyin-pc' : 'douyin';
  return '<div class="' + cls + '">' +
    '<iframe src="' + src + '" frameborder="0" scrolling="no" ' +
    'referrerpolicy="unsafe-url" allowfullscreen></iframe></div>';
});
