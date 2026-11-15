
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

  show();
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(hide, 150);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(hide, 150); });
  }
  window.addEventListener('load', hide);
  setTimeout(hide, 3000);

  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;

    if (a.target === '_blank') return;
    if (a.hasAttribute('download')) return;
    if (href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;

    try {
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    } catch (e) { return; }

    show();
  }, true);

  document.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (f && f.hasAttribute && f.hasAttribute('data-no-loading')) return;
    show();
  }, true);

  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', function (e) {
    hide();
  });
})();
