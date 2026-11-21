/* win7 theme — helpers
 * relative_time：中文相对时间，逻辑移植自用户提供的 PHP format()
 * 用法：<%= relative_time(post.date) %>
 */
'use strict';

const DAY = 86400;

function toSeconds(input) {
  // 兼容 moment 对象 / Date / 数字(秒或毫秒) / 字符串
  let ms;
  if (input == null) return NaN;
  if (typeof input === 'number') {
    ms = input < 1e12 ? input * 1000 : input; // 小于 1e12 视为秒
  } else if (typeof input.valueOf === 'function') {
    ms = input.valueOf(); // moment / Date 都支持
  } else {
    ms = new Date(input).getTime();
  }
  return Math.floor(ms / 1000);
}

// 取某个时间戳(秒)当天 00:00 的时间戳(秒)
function startOfDay(ts) {
  const d = new Date(ts * 1000);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function startOfMonth(ts) {
  const d = new Date(ts * 1000);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function startOfYear(ts) {
  const d = new Date(ts * 1000);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

hexo.extend.helper.register('relative_time', function (input) {
  const time = toSeconds(input);
  if (isNaN(time)) return '';

  const now = Math.floor(Date.now() / 1000);
  const today = startOfDay(now);

  let tmp = now - time;
  if (tmp < 300) return '刚刚';

  // 日历日比较（跨过午夜就算昨天）
  const timeDay = startOfDay(time);

  if (timeDay === today) return '今天';
  if (timeDay === today - DAY) return '昨天';
  if (timeDay === today - DAY * 2) return '前天';

  const days = Math.round((today - timeDay) / DAY);
  if (days < 7) return days + ' 天前';
  if (days < 30) return Math.floor(days / 7) + ' 周前';

  const d = new Date(time * 1000);
  const nowDate = new Date(now * 1000);
  const monthDiff = (nowDate.getFullYear() - d.getFullYear()) * 12 + (nowDate.getMonth() - d.getMonth());
  if (monthDiff < 12) return monthDiff + ' 月前';
  return (nowDate.getFullYear() - d.getFullYear()) + ' 年前';
});

/* 构建时间戳：同一次构建内恒定，每次部署变化。
   用于给 css/js 引用追加 ?v= 参数，确保浏览器与 CDN 在部署后必取新资源。 */
const BUILD_TS = Date.now();
hexo.extend.helper.register('build_ts', function () {
  return BUILD_TS;
});
