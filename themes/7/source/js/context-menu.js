
(function () {
    'use strict';

    var menu = document.getElementById('ctxMenu');
    if (!menu) return;

    function isMobile() {
        return window.innerWidth <= 820 ||
            ('ontouchstart' in window && !window.matchMedia('(pointer:fine)').matches);
    }

    function closeMenu() {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
    }

    function openMenu(x, y) {
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        var mw = menu.offsetWidth;
        var mh = menu.offsetHeight;
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var left = x;
        var top = y;
        if (left + mw > vw) left = Math.max(0, x - mw);
        if (top + mh > vh) top = Math.max(0, y - mh);
        if (left + mw > vw) left = Math.max(0, vw - mw - 2);
        if (top + mh > vh) top = Math.max(0, vh - mh - 2);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    var lastTarget = null;
    var lastRow = null;

    /* 右键落在文章行上时，才显示文章相关的菜单项 */
    function setPostContext(row) {
        lastRow = row || null;
        var items = menu.querySelectorAll('.ctx-post');
        for (var i = 0; i < items.length; i++) {
            if (lastRow) {
                items[i].removeAttribute('hidden');
            } else {
                items[i].setAttribute('hidden', '');
            }
        }
    }

    document.addEventListener('contextmenu', function (e) {
        if (isMobile()) return;
        if (menu.contains(e.target)) return;
        e.preventDefault();
        lastTarget = e.target;
        setPostContext(e.target.closest ? e.target.closest('.file-row') : null);
        openMenu(e.clientX, e.clientY);
    });

    menu.addEventListener('click', function (e) {
        var el = e.target.closest('[data-action]');
        if (!el) return;
        var li = el.closest('[role=menuitem]');
        if (li && li.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();
        var action = el.getAttribute('data-action');
        var row = lastRow;
        closeMenu();
        switch (action) {
            case 'back':
                history.back();
                break;
            case 'forward':
                history.forward();
                break;
            case 'reload':
                location.reload();
                break;
            case 'copy':
                copySelectionOrUrl();
                break;
            case 'paste':
                pasteIntoField();
                break;
            case 'home':
                location.href = (window.__win7Root || '/');
                break;
            case 'open':
                if (row) location.href = rowData(row).url;
                break;
            case 'open-new':
                if (row) window.open(rowData(row).url, '_blank', 'noopener');
                break;
            case 'copy-link':
                if (row) copyText(absUrl(rowData(row).url));
                break;
            case 'props':
                if (row) openProps(row);
                break;
        }
    });

    /* ---------- 文章行数据 ---------- */
    function rowData(row) {
        if (!row) return {};
        var d = row.dataset || {};
        return {
            title: d.title || '', url: d.url || location.href, cover: d.cover || '',
            date: d.date || '', updated: d.updated || d.date || '',
            tags: d.tags || '', cats: d.cats || '',
            chars: parseInt(d.chars || '0', 10) || 0,
            words: parseInt(d.words || '0', 10) || 0,
            bytes: parseInt(d.bytes || '0', 10) || 0
        };
    }
    function absUrl(u) {
        try { return new URL(u, location.href).href; } catch (e) { return u; }
    }
    function fmtDate(s) {
        if (!s || s.length < 8) return '—';
        var t = s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
        if (s.length >= 12) t += ' ' + s.slice(8, 10) + ':' + s.slice(10, 12);
        return t;
    }
    function fmtNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function fmtSize(b) {
        if (!b) return '0 字节';
        if (b < 1024) return b + ' 字节';
        var kb = b / 1024;
        if (kb < 1024) return kb.toFixed(kb < 10 ? 2 : 1) + ' KB';
        return (kb / 1024).toFixed(2) + ' MB';
    }

    /* ---------- 属性窗口 ---------- */
    var props = document.getElementById('postProps');
    var propsData = null;
    var dragBound = false;

    /* 拖动依赖于 bundle 里的 draggable-window.js，加载顺序不保证，
       因此放到首次打开时惰性绑定 */
    function ensureDrag() {
        if (dragBound || !props || !window.win7MakeDraggable) return;
        dragBound = true;
        window.win7MakeDraggable(props, { storeKey: 'win7-prop-pos', breakpoint: 820 });
    }

    function openProps(row) {
        if (!props) return;
        var d = rowData(row);
        propsData = d;
        ensureDrag();

        var icon = document.getElementById('propsIcon');
        if (icon) icon.src = d.cover;
        setText('propsName', d.title || '无标题');
        setText('propsKind', '文章文件');
        setText('propsPath', d.url);
        setText('propsSize', fmtSize(d.bytes) + ' (' + fmtNum(d.bytes) + ' 字节) · ' +
            fmtNum(d.chars) + ' 字符 · 约 ' + Math.max(1, Math.ceil(d.chars / 400)) + ' 分钟读完');
        setText('propsCreated', fmtDate(d.date));
        setText('propsUpdated', fmtDate(d.updated));
        setText('propsTags', d.tags || '无');
        setText('propsCats', d.cats || '未分类');

        props.classList.add('is-open');
        props.setAttribute('aria-hidden', 'false');
        placeProps();
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    /* 每次打开都回到视口中央 */
    function placeProps() {
        props.style.left = '';
        props.style.top = '';
        props.style.right = '';
        props.style.bottom = '';
        props.style.visibility = 'hidden';
        void props.offsetWidth;
        var rect = props.getBoundingClientRect();
        var left = Math.max(8, (window.innerWidth - rect.width) / 2);
        var top = Math.max(8, (window.innerHeight - rect.height) / 2 - 30);
        props.style.left = left + 'px';
        props.style.top = top + 'px';
        props.style.visibility = '';
    }

    function closeProps() {
        if (!props) return;
        props.classList.remove('is-open');
        props.setAttribute('aria-hidden', 'true');
        try { localStorage.removeItem('win7-prop-pos'); } catch (e) { /* ignore */ }
    }

    if (props) {
        props.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            if (btn.id === 'propsClose' || btn.id === 'propsOk') {
                closeProps();
            } else if (btn.id === 'propsOpen') {
                if (propsData) location.href = propsData.url;
            } else if (btn.id === 'propsCopyLink') {
                if (propsData) copyText(absUrl(propsData.url));
            }
        });
        document.addEventListener('keydown', function (e) {
            if ((e.key === 'Escape' || e.key === 'Esc') && props.classList.contains('is-open')) {
                closeProps();
            }
        });
    }

    /* ---------- 剪贴板 ---------- */
    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
        } else {
            legacyCopy(text);
        }
    }

    function copySelectionOrUrl() {
        var sel = window.getSelection ? String(window.getSelection()) : '';
        var text = sel && sel.trim() ? sel : location.href;
        copyText(text);
    }
    function legacyCopy(text) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        } catch (err) {  }
    }

    function pasteIntoField() {
        var field = findEditableField();
        if (!field) return;
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(function (text) { insertAtCursor(field, text); })
                .catch(function () {  });
        }
    }
    function findEditableField() {
        var t = lastTarget;
        if (isTextField(t)) return t;
        var a = document.activeElement;
        if (isTextField(a)) return a;
        return null;
    }
    function isTextField(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag === 'textarea') return !el.disabled && !el.readOnly;
        if (tag === 'input') {
            var t = (el.type || 'text').toLowerCase();
            var ok = ['text', 'search', 'url', 'tel', 'password', 'email', 'number'];
            return ok.indexOf(t) !== -1 && !el.disabled && !el.readOnly;
        }
        return false;
    }
    function insertAtCursor(field, text) {
        if (text == null || text === '') return;
        field.focus();
        var start = field.selectionStart, end = field.selectionEnd;
        if (typeof start === 'number' && typeof end === 'number') {
            var val = field.value;
            field.value = val.slice(0, start) + text + val.slice(end);
            var pos = start + text.length;
            field.setSelectionRange(pos, pos);
        } else {
            field.value += text;
        }
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    document.addEventListener('mousedown', function (e) {
        if (!menu.contains(e.target)) closeMenu();
    });
    document.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', function () {
        closeMenu();
        if (props && props.classList.contains('is-open')) placeProps();
    });
    window.addEventListener('blur', closeMenu);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') closeMenu();
    });
})();
