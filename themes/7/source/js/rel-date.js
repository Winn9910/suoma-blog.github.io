
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

        var d = new Date(time * 1000);
        function p2(n) { return (n < 10 ? '0' : '') + n; }
        var hm = p2(d.getHours()) + ':' + p2(d.getMinutes());

        if (tmp < DAY) return '今天 ' + hm;

        var timeDay = startOfDaySec(time * 1000);

        if (today - DAY <= timeDay) return '昨天 ' + hm;
        if (today - DAY * 2 <= timeDay) return '前天 ' + hm;

        var week = ['日', '一', '二', '三', '四', '五', '六'];
        var dow = d.getDay();
        if (dow === 0) dow = 7;
        var weekStart = today - DAY * dow;

        if (weekStart - DAY * 7 < timeDay) return '本周' + week[d.getDay()];
        if (weekStart - DAY * 14 < timeDay) return '上周' + week[d.getDay()];
        if (weekStart - DAY * 21 < timeDay) return '3 周前';

        var mStart = startOfMonthSec(now * 1000);
        if (mStart <= timeDay) {
            return Math.floor((today - timeDay) / DAY) + ' 天前';
        }
        var prevMonth = startOfMonthSec(mStart * 1000 - 1);
        if (prevMonth <= timeDay) return '上月';

        var yStart = startOfYearSec(now * 1000);
        if (yStart <= timeDay) {
            return (new Date(now * 1000).getMonth() - d.getMonth()) + ' 月前';
        }

        var yearNames = ['去', '前'];
        var yCursor = yStart;
        for (var i = 0; i < yearNames.length; i++) {
            yCursor = startOfYearSec(yCursor * 1000 - 1);
            if (yCursor <= timeDay) return yearNames[i] + '年';
        }
        return (new Date(now * 1000).getFullYear() - d.getFullYear()) + ' 年前';
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
