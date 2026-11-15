/* Win7 等待圈：只保留给真实等待场景（工具栏「刷新」整页重载）使用。
   常规站内跳转是静态页秒开，不再全屏遮罩。 */
(function () {
    function el() { return document.getElementById('win7Loading'); }

    function show() {
        var e = el();
        if (e) { e.classList.add('is-active'); e.setAttribute('aria-hidden', 'false'); }
    }
    function hide() {
        var e = el();
        if (e) { e.classList.remove('is-active'); e.setAttribute('aria-hidden', 'true'); }
    }

    window.__win7ShowLoading = show;
    window.__win7HideLoading = hide;

    // 离开/回到页面时确保遮罩不会残留
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', hide);
})();
