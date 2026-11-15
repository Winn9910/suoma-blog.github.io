(function () {
    var input = document.getElementById('win7Search');
    var panel = document.getElementById('win7SearchResults');
    if (!input || !panel) return;

    var data = null;
    var loading = false;

    function loadIndex() {
        if (data || loading) return;
        loading = true;
        fetch('/search.json')
            .then(function (r) { return r.json(); })
            .then(function (json) {
                data = (json.posts || []).concat(json.pages || []);
                loading = false;
                if (input.value.trim()) search(input.value);
            })
            .catch(function () { loading = false; });
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function snippet(text, q) {
        var idx = text.toLowerCase().indexOf(q);
        if (idx < 0) return text.slice(0, 60);
        var start = Math.max(0, idx - 20);
        return (start > 0 ? '…' : '') + text.slice(start, start + 70) + '…';
    }

    function search(raw) {
        var q = raw.trim().toLowerCase();
        panel.innerHTML = '';
        if (!q) { hide(); return; }

        var hits = [];
        for (var i = 0; i < data.length; i++) {
            var doc = data[i];
            var title = (doc.title || '').toLowerCase();
            var body = (doc.text || '').toLowerCase();
            var ti = title.indexOf(q);
            var bi = body.indexOf(q);
            if (ti === -1 && bi === -1) continue;
            hits.push({ doc: doc, score: ti === -1 ? 1 : 3 });
        }
        hits.sort(function (a, b) { return b.score - a.score; });
        hits = hits.slice(0, 8);

        if (!hits.length) {
            panel.innerHTML = '<div class="win7-search-empty">没有找到相关内容</div>';
            panel.hidden = false;
            return;
        }

        hits.forEach(function (hit, i) {
            var a = document.createElement('a');
            a.className = 'win7-search-item' + (i === 0 ? ' active' : '');
            a.href = '/' + hit.doc.path.replace(/^\//, '');
            a.innerHTML = '<span class="win7-search-title">' + escapeHtml(hit.doc.title || '(无标题)') + '</span>' +
                '<span class="win7-search-snippet">' + escapeHtml(snippet(hit.doc.excerpt || hit.doc.text || '', q)) + '</span>';
            panel.appendChild(a);
        });
        panel.hidden = false;
    }

    function hide() {
        panel.hidden = true;
        panel.innerHTML = '';
    }

    input.addEventListener('focus', loadIndex);
    input.addEventListener('input', function () { loadIndex(); if (data) search(input.value); });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { input.blur(); hide(); }
        if (e.key === 'Enter') {
            var first = panel.querySelector('.win7-search-item');
            if (first) { e.preventDefault(); window.location.href = first.href; }
        }
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('.win7-search')) hide();
    });
})();
