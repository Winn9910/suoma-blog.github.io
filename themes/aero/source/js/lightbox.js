(function () {
    var overlay = null;
    var imgEl = null;
    var hint = null;

    function build() {
        overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.hidden = true;

        imgEl = document.createElement('img');
        imgEl.className = 'lightbox-img';
        imgEl.alt = '';

        hint = document.createElement('span');
        hint.className = 'lightbox-hint';
        hint.textContent = '点击任意处或按 Esc 关闭';

        overlay.appendChild(imgEl);
        overlay.appendChild(hint);
        overlay.addEventListener('click', close);
        document.body.appendChild(overlay);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
        });
    }

    function open(src, alt) {
        if (!overlay) build();
        imgEl.src = src;
        imgEl.alt = alt || '';
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () {
            overlay.classList.add('show');
        });
    }

    function close() {
        if (!overlay || overlay.hidden) return;
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(function () {
            overlay.hidden = true;
            imgEl.src = '';
        }, 200);
    }

    // 事件委托，兼容 PJAX
    document.addEventListener('click', function (e) {
        var img = e.target.closest ? e.target.closest('.post-content img') : null;
        if (!img) return;
        // 被链接包裹的图片不拦截（尊重原有链接行为）
        if (img.closest('a')) return;
        e.preventDefault();
        open(img.currentSrc || img.src, img.alt);
    });
})();
