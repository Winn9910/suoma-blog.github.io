
(function () {
  var page = document.querySelector('.scroll-page');
  if (!page) return;

  var up = page.querySelector('.scroll-up');
  var down = page.querySelector('.scroll-down');
  var THRESHOLD = 200; 

  function scrollTo(top) {
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function toggle() {
    if (window.pageYOffset > THRESHOLD) {
      page.classList.add('is-visible');
      page.setAttribute('aria-hidden', 'false');
    } else {
      page.classList.remove('is-visible');
      page.setAttribute('aria-hidden', 'true');
    }
  }

  if (up) {
    up.addEventListener('click', function () { scrollTo(0); });
    up.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollTo(0); }
    });
  }
  if (down) {
    down.addEventListener('click', function () {
      scrollTo(document.documentElement.scrollHeight);
    });
    down.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollTo(document.documentElement.scrollHeight);
      }
    });
  }

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
})();
