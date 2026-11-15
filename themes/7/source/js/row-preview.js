
(function () {
  var lists = document.querySelectorAll('.explorer-list');
  if (!lists.length) return;

  var bubble = null;
  var hideTimer = null;

  function ensureBubble() {
    if (bubble) return bubble;
    bubble = document.createElement('div');
    bubble.className = 'row-preview';
    bubble.innerHTML =
      '<span class="rp-arrow"></span>' +
      '<img class="rp-cover" alt="">' +
      '<div class="rp-body"><div class="rp-title"></div><div class="rp-excerpt"></div></div>';
    document.body.appendChild(bubble);
    bubble.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    bubble.addEventListener('mouseleave', hide);
    return bubble;
  }

  function show(row) {
    if (window.innerWidth <= 820) return;              
    var excerpt = row.getAttribute('data-excerpt') || '';
    if (!excerpt) return;
    clearTimeout(hideTimer);
    var b = ensureBubble();
    b.querySelector('.rp-cover').src = row.getAttribute('data-cover') || '';
    b.querySelector('.rp-title').textContent = row.getAttribute('data-title') || '';
    b.querySelector('.rp-excerpt').textContent = excerpt;

    b.classList.add('is-visible');
    var r = row.getBoundingClientRect();
    var bw = b.offsetWidth, bh = b.offsetHeight;

    var GAP = 12;                                      
    var arrowX = r.left + r.width / 2;                 
    var left = arrowX - bw / 2;
    var top = r.bottom + GAP;

    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));

    if (top + bh > window.innerHeight - 8) {
      top = r.top - GAP - bh;
      b.classList.add('rp-up');
    } else {
      b.classList.remove('rp-up');
    }

    b.style.left = (left + window.scrollX) + 'px';
    b.style.top = (top + window.scrollY) + 'px';

    var ax = arrowX - left;
    b.querySelector('.rp-arrow').style.left = Math.max(12, Math.min(ax, bw - 12)) + 'px';
    b.querySelector('.rp-arrow').style.marginLeft = '-5px';
  }

  function hide() {
    hideTimer = setTimeout(function () {
      if (bubble) bubble.classList.remove('is-visible');
    }, 120);
  }

  lists.forEach(function (list) {
    list.addEventListener('mouseover', function (e) {
      var row = e.target.closest('.file-row');
      if (row && !row.classList.contains('search-empty')) show(row);
    });
    list.addEventListener('mouseout', function (e) {
      var row = e.target.closest('.file-row');
      if (!row) return;
      if (e.relatedTarget && bubble && bubble.contains(e.relatedTarget)) return;
      hide();
    });
  });
  window.addEventListener('scroll', function () {
    if (bubble) bubble.classList.remove('is-visible');
  }, { passive: true });
})();
