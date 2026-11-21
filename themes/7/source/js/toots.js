
/* 嘟文挂件：实时抓取 gov.box 上 admin 账号的公开嘟文（Mastodon 兼容 API，CORS 全开）。
   账号 id 与站点写死在下方，换账号改这两行即可。 */
(function () {
    'use strict';

    var TOOT_ORIGIN = 'https://gov.box';
    var ACCOUNT_ID = 'a7f340b4b74f8f6fb83405937411b19c';   /* admin@gov.box（盒子君） */
    var LIMIT = 8;

    var gadget = document.getElementById('tootGadget');
    if (!gadget) return;
    var list = document.getElementById('tootList');
    var loading = document.getElementById('tootLoading');
    var errorBox = document.getElementById('tootError');
    var statusEl = document.getElementById('tootUpdated');

    var dragBound = false;

    /* ---------- 相对时间：与文章列表同一套规则 ---------- */
    function startOfDay(ms) {
        var d = new Date(ms);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }
    function relDate(iso) {
        var t = new Date(iso).getTime();
        if (isNaN(t)) return '';
        var today = startOfDay(Date.now());
        var diff = Math.round((today - startOfDay(t)) / 86400e3);
        if (diff <= 0) return '今天';
        if (diff === 1) return '昨天';
        if (diff === 2) return '前天';
        if (diff < 7) return diff + ' 天前';
        if (diff < 30) return Math.floor(diff / 7) + ' 周前';
        var now = new Date();
        var d = new Date(t);
        var md = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (md < 12) return md + ' 月前';
        return (now.getFullYear() - d.getFullYear()) + ' 年前';
    }

    /* ---------- 抓取与渲染 ---------- */
    function stripHtml(html) {
        var doc = new DOMParser().parseFromString(html || '', 'text/html');
        /* Mastodon 的 <br> 在 textContent 里会丢，先把 <br> 换成换行 */
        doc.querySelectorAll('br').forEach(function (br) {
            br.replaceWith(document.createTextNode('\n'));
        });
        return doc.body.textContent.replace(/\n{3,}/g, '\n\n').trim();
    }

    function fmtClock(iso) {
        var d = new Date(iso);
        function p(n) { return (n < 10 ? '0' : '') + n; }
        return p(d.getHours()) + ':' + p(d.getMinutes());
    }

    function renderItem(st) {
        var li = document.createElement('li');
        li.className = 'toot-item';

        var head = document.createElement('div');
        head.className = 'toot-head';
        head.textContent = relDate(st.created_at) + ' ' + fmtClock(st.created_at);
        li.appendChild(head);

        var text = document.createElement('div');
        text.className = 'toot-text';
        text.textContent = stripHtml(st.content) || '（图片嘟文）';
        li.appendChild(text);

        var media = (st.media_attachments || []).filter(function (m) {
            return m.type === 'image' && (m.preview_url || m.url);
        });
        if (media.length) {
            var grid = document.createElement('div');
            grid.className = 'toot-media' + (media.length === 1 ? ' is-single' : '');
            media.slice(0, 4).forEach(function (m) {
                var img = document.createElement('img');
                img.src = m.preview_url || m.url;
                img.alt = (m.description || '嘟文配图');
                img.loading = 'lazy';
                img.addEventListener('click', function () {
                    if (window.win7Lightbox) window.win7Lightbox.open(m.url || m.preview_url, img.alt);
                });
                grid.appendChild(img);
            });
            li.appendChild(grid);
        }

        if (st.url) {
            var more = document.createElement('a');
            more.className = 'toot-link';
            more.href = st.url;
            more.target = '_blank';
            more.rel = 'noopener';
            more.textContent = '打开 ↗';
            li.appendChild(more);
        }
        return li;
    }

    function render(list_) {
        if (loading) loading.hidden = true;
        if (errorBox) errorBox.hidden = true;
        list.hidden = false;
        list.textContent = '';
        list_.forEach(function (st) {
            list.appendChild(renderItem(st));
        });
        if (statusEl) statusEl.textContent = 'gov.box · 已同步 ' + fmtClock(new Date().toISOString());
    }

    function setLoading(on) {
        if (loading) loading.hidden = !on;
        if (errorBox) errorBox.hidden = true;
        list.hidden = on ? true : list.childElementCount ? false : true;
    }

    function fetchToots() {
        setLoading(true);
        var url = TOOT_ORIGIN + '/api/v1/accounts/' + ACCOUNT_ID + '/statuses?limit=' + LIMIT +
            '&exclude_replies=true';
        fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var public_ = (Array.isArray(data) ? data : []).filter(function (st) {
                    return st.visibility === 'public' && !st.in_reply_to_id;
                });
                if (!public_.length) throw new Error('empty');
                render(public_);
            })
            .catch(function () {
                list.hidden = true;
                if (loading) loading.hidden = true;
                if (errorBox) errorBox.hidden = false;
                if (statusEl) statusEl.textContent = 'gov.box · 同步失败';
            });
    }

    /* ---------- 折叠 / 拖拽 / 移动端浮窗 ---------- */
    var scrim = document.getElementById('tootScrim');

    function isMobile() { return window.innerWidth <= 820; }

    function setMobileOpen(open) {
        gadget.classList.toggle('is-open', open);
        if (scrim) scrim.hidden = !open;
    }

    if (scrim) {
        scrim.addEventListener('click', function () { setMobileOpen(false); });
    }

    var toggle = document.getElementById('tootToggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            /* 手机端这个键当「关闭」用 */
            if (isMobile()) { setMobileOpen(false); return; }
            var collapsed = gadget.classList.toggle('collapsed');
            try {
                if (collapsed) localStorage.setItem('win7-toot-collapsed', '1');
                else localStorage.removeItem('win7-toot-collapsed');
            } catch (e) { /* ignore */ }
        });
    }

    /* 右上角「?」按钮：桌面跳 about；手机端改为展开嘟文浮窗 */
    var helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.addEventListener('click', function (e) {
            if (!isMobile()) return;
            e.preventDefault();
            setMobileOpen(!gadget.classList.contains('is-open'));
        });
    }

    document.addEventListener('keydown', function (e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && gadget.classList.contains('is-open')) {
            setMobileOpen(false);
        }
    });

    function ensureDrag() {
        if (dragBound || !window.win7MakeDraggable) return;
        dragBound = true;
        window.win7MakeDraggable(gadget, { storeKey: 'win7-toot-pos', breakpoint: 820 });
    }

    fetchToots();
    ensureDrag();
})();
