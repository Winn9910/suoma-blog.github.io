
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

    document.addEventListener('contextmenu', function (e) {
        if (isMobile()) return;                 
        if (menu.contains(e.target)) return;
        e.preventDefault();
        lastTarget = e.target;
        openMenu(e.clientX, e.clientY);
    });

    menu.addEventListener('click', function (e) {
        var el = e.target.closest('[data-action]');
        if (!el) return;
        var li = el.closest('[role=menuitem]');
        if (li && li.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();            
        var action = el.getAttribute('data-action');
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
        }
    });

    function copySelectionOrUrl() {
        var sel = window.getSelection ? String(window.getSelection()) : '';
        var text = sel && sel.trim() ? sel : location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
        } else {
            legacyCopy(text);
        }
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
    window.addEventListener('resize', closeMenu);
    window.addEventListener('blur', closeMenu);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') closeMenu();
    });
})();
