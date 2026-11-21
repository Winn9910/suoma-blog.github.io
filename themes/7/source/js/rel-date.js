
/* 文章列表的相对日期：在访客浏览器里实时计算。
   构建时（Vercel 服务器为 UTC 时区）写死的相对时间会随构建时间漂移且时区错乱，
   因此 HTML 里输出毫秒时间戳（.rel-date[data-ts]），这里在本地重算一遍。
   规则与 scripts/helpers.js 的 relative_time 保持一致，作为禁用 JS 时的兜底。 */
(function () {
    'use strict';

    var DAY = 86400; // 秒

    function startOfDaySec(ms) {
        var d = new Date(ms);
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
    }
    function startOfMonthSec(ms) {
        var d = new Date(ms);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
    }
    function startOfYearSec(ms) {
        var d = new Date(ms);
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
    }

    function rel(tsMs) {
        var time = Math.floor(tsMs / 1000);
        var now = Math.floor(Date.now() / 1000);
        var today = startOfDaySec(now * 1000);

        var tmp = now - time;
        if (tmp < 300) return '刚刚';

        var timeDay = startOfDaySec(time * 1000);

        if (timeDay === today) return '今天';
        if (timeDay === today - DAY) return '昨天';
        if (timeDay === today - DAY * 2) return '前天';

        var days = Math.round((today - timeDay) / DAY);
        if (days < 7) return days + ' 天前';
        if (days < 30) return Math.floor(days / 7) + ' 周前';

        var d = new Date(time * 1000);
        var nowDate = new Date(now * 1000);
        var monthDiff = (nowDate.getFullYear() - d.getFullYear()) * 12 + (nowDate.getMonth() - d.getMonth());
        if (monthDiff < 12) return monthDiff + ' 月前';
        return (nowDate.getFullYear() - d.getFullYear()) + ' 年前';
    }

    function run() {
        var els = document.querySelectorAll('.rel-date[data-ts]');
        for (var i = 0; i < els.length; i++) {
            var ts = parseFloat(els[i].getAttribute('data-ts'));
            if (!isNaN(ts)) els[i].textContent = rel(ts);
            els[i].removeAttribute('data-ts');   /* 算完即弃，避免 PJAX 场景重复处理 */
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
