
/* Win7 截图工具：getDisplayMedia 取真实屏幕画面 → 拖框裁剪 → 保存/复制 */
(function () {
    'use strict';

    var layer = document.getElementById('snipLayer');
    var video = document.getElementById('snipVideo');
    var rectEl = document.getElementById('snipRect');
    var sizeEl = document.getElementById('snipSize');
    var hintEl = document.getElementById('snipHint');
    var win = document.getElementById('snipWin');
    var preview = document.getElementById('snipPreview');
    var metaEl = document.getElementById('snipMeta');
    var msgWin = document.getElementById('snipMsg');
    var msgText = document.getElementById('snipMsgText');

    if (!layer || !video || !win) return;

    var stream = null;
    var dragging = false;
    var startX = 0, startY = 0;
    var lastCanvas = null;
    var dragBound = false;

    function supported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    }

    /* ---------- 提示框 ---------- */
    function msg(text) {
        if (!msgWin) return;
        if (msgText) msgText.textContent = text;
        msgWin.classList.add('is-open');
        msgWin.setAttribute('aria-hidden', 'false');
        if (window.win7CenterWindow) window.win7CenterWindow(msgWin, { dy: -10 });
    }
    function closeMsg() {
        if (!msgWin) return;
        msgWin.classList.remove('is-open');
        msgWin.setAttribute('aria-hidden', 'true');
    }

    /* ---------- 遮罩与选区 ---------- */
    function showLayer() {
        layer.classList.add('is-open');
        layer.setAttribute('aria-hidden', 'false');
        rectEl.hidden = true;
        if (hintEl) hintEl.textContent = '正在等待屏幕画面…';
    }
    function hideLayer() {
        layer.classList.remove('is-open');
        layer.setAttribute('aria-hidden', 'true');
        rectEl.hidden = true;
        dragging = false;
    }

    function stopStream() {
        if (!stream) return;
        stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* ignore */ } });
        stream = null;
        try { video.srcObject = null; } catch (e) { /* ignore */ }
    }

    function cancel() {
        stopStream();
        hideLayer();
    }

    /* video 用 object-fit:contain，算出画面在屏幕上的实际矩形与缩放比 */
    function videoRect() {
        var vw = video.videoWidth || window.innerWidth;
        var vh = video.videoHeight || window.innerHeight;
        var scale = Math.min(window.innerWidth / vw, window.innerHeight / vh);
        var w = vw * scale, h = vh * scale;
        return { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2, w: w, h: h, scale: scale };
    }

    function start() {
        if (!supported()) {
            msg('当前浏览器不支持屏幕捕获。请换用较新的 Chrome / Edge / Firefox，或直接用系统截图（Win+Shift+S）。');
            return;
        }
        showLayer();
        var opts = { video: { frameRate: 30 }, audio: false };
        navigator.mediaDevices.getDisplayMedia(opts).then(function (s) {
            stream = s;
            video.srcObject = s;
            var p = video.play();
            if (p && p.catch) p.catch(function () { /* 自动播放被阻止也不影响手动交互 */ });
            var track = s.getVideoTracks()[0];
            if (track) {
                track.addEventListener('ended', function () {   /* 用户点了浏览器的「停止共享」 */
                    if (layer.classList.contains('is-open')) cancel();
                });
            }
            if (hintEl) hintEl.textContent = '拖动鼠标选择要截取的区域，按 Esc 取消';
        }).catch(function (err) {
            cancel();
            if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) return;  /* 用户主动取消，静默 */
            msg('无法获取屏幕画面：' + ((err && err.name) || '未知错误'));
        });
    }

    function updateRect(x1, y1, x2, y2) {
        var left = Math.min(x1, x2), top = Math.min(y1, y2);
        var w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
        rectEl.hidden = false;
        rectEl.style.left = left + 'px';
        rectEl.style.top = top + 'px';
        rectEl.style.width = w + 'px';
        rectEl.style.height = h + 'px';
        if (sizeEl) sizeEl.textContent = Math.round(w) + ' × ' + Math.round(h);
        return { x: left, y: top, w: w, h: h };
    }

    layer.addEventListener('pointerdown', function (e) {
        if (!stream) return;                 /* 画面还没就绪 */
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        updateRect(startX, startY, startX, startY);
        if (hintEl) hintEl.textContent = '';
        layer.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    layer.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        updateRect(startX, startY, e.clientX, e.clientY);
    });

    layer.addEventListener('pointerup', function (e) {
        if (!dragging) return;
        dragging = false;
        try { if (layer.hasPointerCapture(e.pointerId)) layer.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        var sel = updateRect(startX, startY, e.clientX, e.clientY);
        if (sel.w < 6 || sel.h < 6) { cancel(); return; }   /* 误点一下不算 */
        capture(sel);
    });

    layer.addEventListener('pointercancel', function () {
        if (dragging) cancel();
    });

    /* ---------- 裁剪 ---------- */
    function capture(sel) {
        var vr = videoRect();
        var sx = Math.max(0, (sel.x - vr.x) / vr.scale);
        var sy = Math.max(0, (sel.y - vr.y) / vr.scale);
        var sw = Math.min(video.videoWidth - sx, sel.w / vr.scale);
        var sh = Math.min(video.videoHeight - sy, sel.h / vr.scale);
        if (sw < 1 || sh < 1) { cancel(); return; }

        var canvas = document.createElement('canvas');
        canvas.width = Math.round(sw);
        canvas.height = Math.round(sh);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        lastCanvas = canvas;
        stopStream();
        hideLayer();
        showResult(canvas);
    }

    function showResult(canvas) {
        if (preview) {
            preview.src = canvas.toDataURL('image/png');
        }
        if (metaEl) {
            metaEl.textContent = canvas.width + ' × ' + canvas.height + ' 像素';
        }
        ensureDrag();
        win.classList.add('is-open');
        win.setAttribute('aria-hidden', 'false');
        if (window.win7CenterWindow) window.win7CenterWindow(win, { dy: -20 });
    }

    function closeWin() {
        win.classList.remove('is-open');
        win.setAttribute('aria-hidden', 'true');
        try { localStorage.removeItem('win7-snip-pos'); } catch (e) { /* ignore */ }
    }

    function ensureDrag() {
        if (dragBound || !window.win7MakeDraggable) return;
        dragBound = true;
        window.win7MakeDraggable(win, { storeKey: 'win7-snip-pos', breakpoint: 820 });
    }

    /* ---------- 保存 / 复制 ---------- */
    function stamp() {
        var d = new Date();
        function p(n) { return (n < 10 ? '0' : '') + n; }
        return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    }

    function save() {
        if (!lastCanvas) return;
        lastCanvas.toBlob(function (blob) {
            if (!blob) return;
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = '截图-' + stamp() + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        }, 'image/png');
    }

    function copy() {
        if (!lastCanvas) return;
        if (!navigator.clipboard || !window.ClipboardItem) {
            msg('当前浏览器不支持复制图片，请改用「保存」。');
            return;
        }
        lastCanvas.toBlob(function (blob) {
            if (!blob) return;
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                .then(function () { if (metaEl) metaEl.textContent += ' · 已复制'; })
                .catch(function () { msg('复制失败，请改用「保存」。'); });
        }, 'image/png');
    }

    /* ---------- 事件 ---------- */
    win.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (btn.id === 'snipWinClose') closeWin();
        else if (btn.id === 'snipNew') { closeWin(); start(); }
        else if (btn.id === 'snipSave') save();
        else if (btn.id === 'snipCopy') copy();
    });

    if (msgWin) {
        msgWin.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (btn && (btn.id === 'snipMsgOk' || btn.id === 'snipMsgClose')) closeMsg();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        if (layer.classList.contains('is-open')) { e.preventDefault(); cancel(); }
        else if (msgWin && msgWin.classList.contains('is-open')) closeMsg();
        else if (win.classList.contains('is-open')) closeWin();
    });

    window.win7Snip = {
        start: start,
        /* 给无头验证用：直接把 canvas 塞进结果窗 */
        _show: showResult
    };
})();
