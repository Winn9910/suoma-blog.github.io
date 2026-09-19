(function () {
    var searchData = null;   // [{title, url, date, content}]
    var loading = false;

    function loadIndex() {
        if (searchData || loading) return Promise.resolve(searchData);
        loading = true;
        return fetch('/search.xml')
            .then(function (r) { return r.text(); })
            .then(function (text) {
                var doc = new DOMParser().parseFromString(text, 'text/xml');
                var entries = doc.getElementsByTagName('entry');
                var list = [];
                for (var i = 0; i < entries.length; i++) {
                    var e = entries[i];
                    var get = function (tag) {
                        var el = e.getElementsByTagName(tag)[0];
                        return el ? el.textContent : '';
                    };
                    list.push({
                        title: get('title'),
                        url: get('url') || get('link'),
                        date: (get('updated') || '').slice(0, 10),
                        content: get('content').replace(/<[^>]+>/g, ' ')
                    });
                }
                searchData = list;
                return list;
            })
            .catch(function () {
                return [];
            })
            .finally(function () { loading = false; });
    }

    function render(box, results, query) {
        if (!query) { box.hidden = true; box.innerHTML = ''; return; }
        if (!results.length) {
            box.innerHTML = '<div class="search-empty">没有找到「' + query.replace(/</g, '&lt;') + '」相关文章</div>';
        } else {
            var html = '';
            results.forEach(function (r) {
                html += '<a class="search-item" href="' + r.url + '">' +
                    '<span class="search-item-title">' + r.title + '</span>' +
                    '<span class="search-item-meta">' + r.date + '</span></a>';
            });
            box.innerHTML = html;
        }
        box.hidden = false;
    }

    function escapeReg(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 事件委托，兼容 PJAX
    document.addEventListener('input', function (e) {
        if (e.target.id !== 'site-search') return;
        var input = e.target;
        var box = document.getElementById('search-results');
        if (!box) return;
        var query = input.value.trim().toLowerCase();
        if (!query) { box.hidden = true; box.innerHTML = ''; return; }

        loadIndex().then(function (list) {
            if (!list) return;
            var reg = new RegExp(escapeReg(query), 'i');
            var results = list.filter(function (p) {
                return reg.test(p.title) || reg.test(p.content);
            }).slice(0, 8);
            render(box, results, query);
        });
    });

    // 点击结果后关闭面板（PJAX 会接管跳转）
    document.addEventListener('click', function (e) {
        var box = document.getElementById('search-results');
        if (!box) return;
        if (e.target.closest('.search-item')) {
            box.hidden = true;
            var input = document.getElementById('site-search');
            if (input) input.value = '';
        } else if (!e.target.closest('.header-search')) {
            box.hidden = true;
        }
    });

    // Enter 跳转第一条结果
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.target.id !== 'site-search') return;
        var box = document.getElementById('search-results');
        var first = box && box.querySelector('.search-item');
        if (first) first.click();
    });

    // 滚动时收起搜索条，回到顶部展开
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            var bar = document.querySelector('.header-search');
            if (bar) {
                bar.classList.toggle('search-hidden', window.scrollY > 100);
            }
            ticking = false;
        });
    }, { passive: true });
})();
