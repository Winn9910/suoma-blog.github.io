
(function () {
  var toggle = document.getElementById('mobileMenuToggle');
  var sidebar = document.getElementById('explorerSidebar');
  if (!toggle || !sidebar) return;

  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!sidebar.classList.contains('is-open'));
  });

  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', function (e) {
    if (!sidebar.classList.contains('is-open')) return;
    if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) setOpen(false);
  });
})();

(function () {
  var toggle = document.getElementById('mobileSearchToggle');
  var crumbs = document.getElementById('nav-breadcrumbs');
  var input = document.getElementById('siteSearchInput');
  if (!toggle || !crumbs) return;

  function setOpen(open) {
    crumbs.classList.toggle('is-search-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && input) { setTimeout(function () { input.focus(); }, 0); }
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!crumbs.classList.contains('is-search-open'));
  });

  document.addEventListener('click', function (e) {
    if (!crumbs.classList.contains('is-search-open')) return;
    var box = document.getElementById('search-box');
    if ((box && box.contains(e.target)) || toggle.contains(e.target)) return;
    if (input && input.value.trim()) return;
    setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (!input || !input.value.trim())) setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) setOpen(false);
  });
})();
