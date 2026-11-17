
/* 个性化面板 + UAC 确认弹窗 + 外观变量的持久化 */
(function () {
    'use strict';

    var STORE = 'win7-appearance';
    var DEFAULT = { color: '#7a5aa0', tint: 0.6 };
    var root = document.documentElement;

    /* 旧版本遗留的音效键，顺手清掉 */
    try { localStorage.removeItem('win7-sound'); } catch (e) { /* ignore */ }

    function safeParse(raw, fallback) {
        try {
            var v = JSON.parse(raw);
            return v && typeof v === 'object' ? v : fallback;
        } catch (e) { return fallback; }
    }

    function readStore() {
        var v = DEFAULT;
        try { v = safeParse(localStorage.getItem(STORE), DEFAULT); } catch (e) { /* ignore */ }
        return {
            color: v.color || DEFAULT.color,
            tint: typeof v.tint === 'number' ? v.tint : DEFAULT.tint
        };
    }

    function writeStore(s) {
        try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* ignore */ }
    }

    /* 只改写 html 上的两个变量，所有窗体自动跟随 */
    function applyAppearance(a) {
        root.style.setProperty('--w7-w-bg', a.color);
        root.style.setProperty('--w7-tint', String(a.tint));
    }

    /* ---------- UAC ---------- */
    var uacLayer = document.getElementById('uacLayer');
    var uacPending = null;

    function uacClose(confirmed) {
        if (!uacLayer) return;
        uacLayer.classList.remove('is-open');
        uacLayer.setAttribute('aria-hidden', 'true');
        var p = uacPending;
        uacPending = null;
        if (!p) return;
        if (confirmed) {
            if (p.onYes) p.onYes();
        } else if (p.onNo) {
            p.onNo();
        }
    }

    window.win7Uac = {
        confirm: function (opts) {
            opts = opts || {};
            if (!uacLayer) { if (opts.onYes) opts.onYes(); return; }
            setText('uacApp', opts.app || 'Win7 博客主题');
            setText('uacAction', opts.action || '更改窗口外观');
            var det = document.getElementById('uacDetails');
            var tog = document.getElementById('uacDetailsToggle');
            if (det) det.hidden = true;
            if (tog) { tog.textContent = '显示详细信息'; tog.setAttribute('aria-expanded', 'false'); }
            uacPending = opts;
            uacLayer.classList.add('is-open');
            uacLayer.setAttribute('aria-hidden', 'false');
            var yes = document.getElementById('uacYes');
            if (yes) yes.focus();
        }
    };

    if (uacLayer) {
        uacLayer.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) {
                if (e.target === uacLayer) uacClose(false);
                return;
            }
            if (btn.id === 'uacYes') uacClose(true);
            else if (btn.id === 'uacNo') uacClose(false);
            else if (btn.id === 'uacDetailsToggle') {
                var det = document.getElementById('uacDetails');
                if (!det) return;
                det.hidden = !det.hidden;
                btn.textContent = det.hidden ? '显示详细信息' : '收起详细信息';
                btn.setAttribute('aria-expanded', det.hidden ? 'false' : 'true');
            }
        });
        document.addEventListener('keydown', function (e) {
            if (!uacLayer.classList.contains('is-open')) return;
            if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); uacClose(false); }
            else if (e.key === 'Enter') { e.preventDefault(); uacClose(true); }
        });
    }

    /* ---------- 个性化窗口 ---------- */
    var win = document.getElementById('personalizeWin');
    var swatches = win ? win.querySelectorAll('.pz-swatch') : [];
    var tintInput = document.getElementById('pzTint');
    var tintOut = document.getElementById('pzTintOut');
    var dragBound = false;
    var snapshot = null;

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function markSwatch(color) {
        for (var i = 0; i < swatches.length; i++) {
            var b = swatches[i];
            var hit = (b.getAttribute('data-color') || '').toLowerCase() === color.toLowerCase();
            b.setAttribute('aria-checked', hit ? 'true' : 'false');
            b.classList.toggle('is-checked', hit);
        }
    }

    function fillForm(a) {
        markSwatch(a.color);
        if (tintInput) tintInput.value = String(Math.round(a.tint * 100));
        if (tintOut) tintOut.textContent = Math.round(a.tint * 100) + '%';
    }

    function currentForm() {
        var checked = win ? win.querySelector('.pz-swatch[aria-checked=true]') : null;
        return {
            color: checked ? checked.getAttribute('data-color') : DEFAULT.color,
            tint: tintInput ? Math.min(1, Math.max(0.2, parseInt(tintInput.value, 10) / 100)) : DEFAULT.tint
        };
    }

    function ensureDrag() {
        if (dragBound || !win || !window.win7MakeDraggable) return;
        dragBound = true;
        window.win7MakeDraggable(win, { storeKey: 'win7-pz-pos', breakpoint: 820 });
    }

    function openWin() {
        if (!win) return;
        var a = readStore();
        snapshot = a;
        applyAppearance(a);
        fillForm(a);
        ensureDrag();
        win.classList.add('is-open');
        win.setAttribute('aria-hidden', 'false');
        if (window.win7CenterWindow) window.win7CenterWindow(win, { dy: -18 });
    }

    function closeWin() {
        if (!win) return;
        win.classList.remove('is-open');
        win.setAttribute('aria-hidden', 'true');
        try { localStorage.removeItem('win7-pz-pos'); } catch (e) { /* ignore */ }
    }

    function cancelWin() {
        if (snapshot) applyAppearance(snapshot);
        closeWin();
    }

    function commitWin() {
        var next = currentForm();
        writeStore(next);
        applyAppearance(next);
        closeWin();
    }

    if (win) {
        win.addEventListener('click', function (e) {
            var sw = e.target.closest('.pz-swatch');
            if (sw) {
                markSwatch(sw.getAttribute('data-color'));
                applyAppearance(currentForm());   /* 即时预览 */
                return;
            }
            var btn = e.target.closest('button');
            if (!btn) return;
            if (btn.id === 'personalizeClose' || btn.id === 'pzCancel') {
                cancelWin();
            } else if (btn.id === 'pzOk') {
                /* Win7 的仪式感：应用外观前先过一道 UAC */
                window.win7Uac.confirm({
                    app: 'Win7 博客主题',
                    action: '更改窗口外观',
                    onYes: commitWin,
                    onNo: cancelWin
                });
            }
        });

        if (tintInput) {
            tintInput.addEventListener('input', function () {
                if (tintOut) tintOut.textContent = tintInput.value + '%';
                applyAppearance(currentForm());
            });
        }
    }

    /* 供右键菜单调用 */
    window.win7Personalize = {
        open: openWin
    };

    /* 首屏若已有保存值，刷新界面控件状态（变量本身由 head 内联脚本先行应用） */
    applyAppearance(readStore());
})();
