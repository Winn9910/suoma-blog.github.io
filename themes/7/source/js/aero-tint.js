
/* Aero 封面取色：文章页取封面（或正文首图）主色，把窗体玻璃染成相近色调。
   首页保持用户在「个性化」里选的配色；可在个性化面板里关掉。 */
(function () {
    'use strict';

    var src = document.querySelector('.aero-source');
    if (!src) return;                       /* 只在文章页生效 */

    function appearance() {
        try { return JSON.parse(localStorage.getItem('win7-appearance') || '{}') || {}; }
        catch (e) { return {}; }
    }
    if (appearance().autoTint === false) return;

    /* ---------- 颜色换算 ---------- */
    function rgb2hsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var l = (max + min) / 2, h = 0, s = 0;
        if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        return { h: h, s: s, l: l };
    }

    function hsl2hex(h, s, l) {
        h = ((h % 360) + 360) % 360;
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        var m = l - c / 2;
        var rgb;
        if (h < 60) rgb = [c, x, 0];
        else if (h < 120) rgb = [x, c, 0];
        else if (h < 180) rgb = [0, c, x];
        else if (h < 240) rgb = [0, x, c];
        else if (h < 300) rgb = [x, 0, c];
        else rgb = [c, 0, x];
        return '#' + rgb.map(function (v) {
            var n = Math.round((v + m) * 255);
            return (n < 16 ? '0' : '') + n.toString(16);
        }).join('');
    }

    /* 取出主色调，再压到适合窗体的范围（保证标题栏白字可读） */
    function analyze(img) {
        var N = 24;
        var c = document.createElement('canvas');
        c.width = N;
        c.height = N;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, N, N);
        var data = ctx.getImageData(0, 0, N, N).data;

        var buckets = {};
        for (var i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 200) continue;
            var hsl = rgb2hsl(data[i], data[i + 1], data[i + 2]);
            if (hsl.s < 0.12) continue;                       /* 灰白黑不要 */
            if (hsl.l < 0.08 || hsl.l > 0.94) continue;
            var k = Math.floor(hsl.h / 30);
            var w = hsl.s * (1 - Math.abs(hsl.l - 0.5));      /* 中间亮度更可信 */
            var o = buckets[k] || (buckets[k] = { w: 0, r: 0, g: 0, b: 0 });
            o.w += w;
            o.r += data[i] * w;
            o.g += data[i + 1] * w;
            o.b += data[i + 2] * w;
        }

        var best = null;
        for (var key in buckets) {
            if (!best || buckets[key].w > best.w) best = buckets[key];
        }
        if (!best || best.w <= 0) return null;               /* 纯灰度封面就没有主色 */

        var h2 = rgb2hsl(best.r / best.w, best.g / best.w, best.b / best.w);
        var s2 = Math.min(0.55, Math.max(0.28, h2.s));
        var l2 = Math.min(0.46, Math.max(0.30, h2.l));
        return hsl2hex(h2.h, s2, l2);
    }

    function sourceUrl() {
        var cover = src.getAttribute('data-cover');
        if (cover) return cover;
        var imgs = document.querySelectorAll('.post-content img');
        var fallback = '';
        for (var i = 0; i < imgs.length; i++) {
            var im = imgs[i];
            var u = im.getAttribute('data-src') || im.getAttribute('src') || im.currentSrc;
            if (!u) continue;
            if (!fallback) fallback = u;
            var w = im.naturalWidth || im.width || 0;
            if (w >= 240) return u;                          /* 优先用像样的配图，跳过小图标 */
        }
        return fallback;
    }

    function apply(hex) {
        if (!hex) return;
        document.documentElement.style.setProperty('--w7-w-bg', hex);
        document.documentElement.setAttribute('data-aero-tint', hex);
    }

    var url = sourceUrl();
    if (!url) return;

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        try {
            apply(analyze(img));
        } catch (e) {
            /* 跨域图片污染 canvas：保持用户配色，不报错 */
        }
    };
    img.src = url;
})();
