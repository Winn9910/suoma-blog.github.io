
(function () {
  var tabs = document.getElementById('explorer-tabs');
  if (!tabs) return;

  var toggle = tabs.querySelector('.view-toggle');
  var dropdown = tabs.querySelector('.dropdown');
  var list = document.getElementById('postFileList');
  var keySel = document.getElementById('sortKey');
  var dirSel = document.getElementById('sortDir');
  var apply = document.getElementById('sortApply');
  if (!toggle || !dropdown || !list) return;

  var STORE_KEY = 'win7_post_sort';

  function open() {
    dropdown.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    tabs.classList.add('is-open');
  }
  function close() {
    dropdown.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    tabs.classList.remove('is-open');
  }
  function toggleOpen() { dropdown.hidden ? open() : close(); }

  toggle.addEventListener('click', function (e) { e.stopPropagation(); toggleOpen(); });
  toggle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(); }
    if (e.key === 'Escape') close();
  });
  dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
  document.addEventListener('click', close);

  function sortRows(key, dir) {
    var rows = Array.prototype.slice.call(list.querySelectorAll('.file-row'));
    rows.sort(function (a, b) {
      var av, bv;
      if (key === 'title') {
        av = (a.getAttribute('data-title') || '').toLowerCase();
        bv = (b.getAttribute('data-title') || '').toLowerCase();
        return dir === 'asc' ? av.localeCompare(bv, 'zh') : bv.localeCompare(av, 'zh');
      }
      av = parseInt(a.getAttribute('data-date') || '0', 10);
      bv = parseInt(b.getAttribute('data-date') || '0', 10);
      return dir === 'asc' ? av - bv : bv - av;
    });
    rows.forEach(function (r) { list.appendChild(r); });
  }

  function applySort() {
    var key = keySel ? keySel.value : 'date';
    var dir = dirSel ? dirSel.value : 'desc';
    sortRows(key, dir);
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ key: key, dir: dir })); } catch (e) {}
    close();
  }

  if (apply) apply.addEventListener('click', applySort);

  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) {
      if (keySel && saved.key) keySel.value = saved.key;
      if (dirSel && saved.dir) dirSel.value = saved.dir;
      if (!(saved.key === 'date' && saved.dir === 'desc')) {
        sortRows(saved.key, saved.dir);
      }
    }
  } catch (e) {}
})();
