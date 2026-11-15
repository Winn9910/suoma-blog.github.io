
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var input = document.getElementById('siteSearchInput');
        var clearBtn = document.getElementById('siteSearchClear');
        var list = document.querySelector('.file-list');

        if (!input) return;

        var root = (window.__win7Root || '/');

        if (!list) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    var kw = input.value.trim();
                    location.href = root + (kw ? ('?q=' + encodeURIComponent(kw)) : '');
                }
            });
            return;
        }

        var originalRows = Array.prototype.slice.call(list.children);
        var pager = document.querySelector('.page-nav');

        var siteData = null;
        var loading = false;
        var pendingQuery = null;

        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }

        function escapeReg(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function highlight(text, terms) {
            if (!terms.length) return escapeHtml(text);
            var re = new RegExp('(' + terms.map(escapeReg).join('|') + ')', 'gi');
            var out = '', last = 0, m;
            re.lastIndex = 0;
            while ((m = re.exec(text)) !== null) {
                out += escapeHtml(text.slice(last, m.index));
                out += '<mark class="search-hit">' + escapeHtml(m[0]) + '</mark>';
                last = m.index + m[0].length;
                if (m.index === re.lastIndex) re.lastIndex++; 
            }
            out += escapeHtml(text.slice(last));
            return out;
        }

        function snippet(item, terms) {
            var text = item.content || item.excerpt || '';
            if (!terms.length) return escapeHtml((item.excerpt || text).slice(0, 90));
            var lower = text.toLowerCase();
            var pos = -1;
            for (var i = 0; i < terms.length; i++) {
                var p = lower.indexOf(terms[i]);
                if (p !== -1 && (pos === -1 || p < pos)) pos = p;
            }
            if (pos === -1) return highlight((item.excerpt || text).slice(0, 90), terms);
            var start = Math.max(0, pos - 30);
            var seg = (start > 0 ? '…' : '') + text.slice(start, start + 90) + '…';
            return highlight(seg, terms);
        }

        var emptyTip = document.createElement('li');
        emptyTip.className = 'file-row search-empty';
        emptyTip.style.display = 'none';
        emptyTip.innerHTML = '<span class="col-name">未找到匹配 “<b class="search-empty-kw"></b>” 的文章</span>';
        var emptyKwEl = emptyTip.querySelector('.search-empty-kw');

        function renderResults(query) {
            var q = query.trim().toLowerCase();
            var terms = q ? q.split(/\s+/).filter(Boolean) : [];

            if (!terms.length) {
                list.innerHTML = '';
                originalRows.forEach(function (r) { list.appendChild(r); });
                if (pager) pager.style.display = '';
                if (clearBtn) clearBtn.style.display = 'none';
                return;
            }

            if (!siteData) { filterVisible(terms); loadData(query); return; }

            var matched = siteData.filter(function (item) {
                var hay = (item.title + ' ' + item.excerpt + ' ' + item.content + ' ' + (item.tags || []).join(' ')).toLowerCase();
                return terms.every(function (t) { return hay.indexOf(t) !== -1; });
            });

            list.innerHTML = '';
            if (!matched.length) {
                list.appendChild(emptyTip);
                emptyTip.style.display = '';
                emptyKwEl.textContent = query.trim();
            } else {
                matched.forEach(function (item) {
                    var li = document.createElement('li');
                    li.className = 'file-row';
                    li.setAttribute('onclick', "location.href='" + item.url + "'");
                    li.innerHTML =
                        '<span class="col-name">' +
                            (item.icon ? '<img class="file-ico" src="' + item.icon + '" alt="">' : '') +
                            '<a class="file-title" href="' + item.url + '">' + highlight(item.title, terms) + '</a>' +
                        '</span>' +
                        '<span class="col-date">' + escapeHtml(item.date) + '</span>' +
                        '<span class="col-desc file-excerpt">' + snippet(item, terms) + '</span>';
                    list.appendChild(li);
                });
            }
            if (pager) pager.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'inline-flex';
        }

        function filterVisible(terms) {
            originalRows.forEach(function (row) {
                if (row.classList && row.classList.contains('search-empty')) return;
                var text = (row.textContent || '').toLowerCase();
                var hit = terms.every(function (t) { return text.indexOf(t) !== -1; });
                row.style.display = hit ? '' : 'none';
            });
            if (pager) pager.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'inline-flex';
        }

        function loadData(query) {
            pendingQuery = query;
            if (siteData || loading) return;
            loading = true;
            fetch(root + 'search.json', { credentials: 'same-origin' })
                .then(function (r) { return r.ok ? r.json() : []; })
                .then(function (data) {
                    siteData = Array.isArray(data) ? data : [];
                    loading = false;
                    originalRows.forEach(function (row) { row.style.display = ''; });
                    renderResults(pendingQuery != null ? pendingQuery : input.value);
                })
                .catch(function () { loading = false; siteData = []; });
        }

        var timer = null;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            var val = input.value;
            timer = setTimeout(function () { renderResults(val); }, 120);
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.value = '';
                renderResults('');
                input.blur();
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                input.value = '';
                renderResults('');
                input.focus();
            });
        }

        var qs = new URLSearchParams(location.search);
        var initial = qs.get('q');
        if (initial) {
            input.value = initial;
            renderResults(initial);
        }
    });
})();
