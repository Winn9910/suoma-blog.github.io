(function () {
    var MAX_IMAGES = 4;

    function buildPhotos(images) {
        var wrap = document.createElement('div');
        wrap.className = 'moment-photos' + (images.length > 1 ? ' moment-photos-grid' : '');
        images.slice(0, MAX_IMAGES).forEach(function (src) {
            var img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';
            img.onerror = function () { wrap.style.display = 'none'; };
            wrap.appendChild(img);
        });
        return wrap;
    }

    function render(m) {
        var card = document.querySelector('.moments-widget');
        if (!card) {
            var music = document.querySelector('.music-widget');
            if (!music || !music.parentNode) return;
            card = document.createElement('div');
            card.className = 'widget card moments-widget';
            card.innerHTML = '<div class="moments-title">最新说说</div>' +
                '<a class="moment-item" target="_blank" rel="noopener">' +
                '<div class="moment-text"></div><div class="moment-date"></div></a>';
            music.parentNode.insertBefore(card, music.nextSibling);
        }

        var item = card.querySelector('.moment-item');
        if (!item) return;
        item.href = m.url;

        var textEl = card.querySelector('.moment-text');
        if (textEl) {
            if (m.text) {
                textEl.textContent = m.text;
                textEl.hidden = false;
            } else {
                textEl.hidden = true;
            }
        }

        var old = card.querySelector('.moment-photos');
        if (old) old.parentNode.removeChild(old);
        if (m.images && m.images.length) {
            item.insertBefore(buildPhotos(m.images), item.firstChild);
        }

        card.querySelector('.moment-date').textContent = m.date;
    }

    function load() {
        if (!document.querySelector('.music-widget')) return;
        fetch('/api/moments', { headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok && data.moments && data.moments[0]) {
                    render(data.moments[0]);
                }
            })
            .catch(function () { /* 失败保留静态内容 */ });
    }

    document.addEventListener('DOMContentLoaded', load);
    document.addEventListener('pjax:complete', load);
})();
