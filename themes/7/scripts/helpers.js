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

  const d = new Date(time * 1000);
  const p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  const hm = p2(d.getHours()) + ':' + p2(d.getMinutes());

  // 归一到当天 00:00 做日历日比较（跨过午夜就算"昨天"，不看 24 小时差）
  const timeDay = startOfDay(time);

  // 今天 / 昨天 / 前天
  if (timeDay === today) return '今天 ' + hm;
  if (timeDay === today - DAY) return '昨天 ' + hm;
  if (timeDay === today - DAY * 2) return '前天 ' + hm;

  // 本周 / 上周 周几
  const week = ['日', '一', '二', '三', '四', '五', '六'];
  let dow = new Date(now * 1000).getDay(); // 0=周日
  if (dow === 0) dow = 7;
  const weekStart = today - DAY * dow; // 本周周日 00:00 的前一刻基准

  const weekNames = ['', '上'];
  for (let k = 0; k < weekNames.length; k++) {
    if (weekStart - DAY * 7 * k < timeDay) {
      return weekNames[k] + '周' + week[new Date(time * 1000).getDay()];
    }
  }

  if (weekStart - DAY * 7 * 2 < timeDay) {
    return '3 周前';
  }

  // 本月内
  let mStart = startOfMonth(now);
  if (mStart <= timeDay) {
    return Math.floor((today - timeDay) / DAY) + ' 天前';
  }

  // 上个月
  const prevMonth = startOfMonth(mStart - 1);
  if (prevMonth <= timeDay) {
    return '上月';
  }

  // 今年内
  const yStart = startOfYear(now);
  if (yStart <= timeDay) {
    const nowMonth = new Date(now * 1000).getMonth() + 1;
    const tMonth = new Date(time * 1000).getMonth() + 1;
    return (nowMonth - tMonth) + ' 月前';
  }

  // 去年 / 前年
  const yearNames = ['去', '前'];
  let yCursor = yStart;
  for (let i = 0; i < yearNames.length; i++) {
    yCursor = startOfYear(yCursor - 1);
    if (yCursor <= timeDay) {
      return yearNames[i] + '年';
    }
  }

  const nowYear = new Date(now * 1000).getFullYear();
  const tYear = new Date(time * 1000).getFullYear();
  return (nowYear - tYear) + ' 年前';
});

/* 构建时间戳：同一次构建内恒定，每次部署变化。
   用于给 css/js 引用追加 ?v= 参数，确保浏览器与 CDN 在部署后必取新资源。 */
const BUILD_TS = Date.now();
hexo.extend.helper.register('build_ts', function () {
  return BUILD_TS;
});
