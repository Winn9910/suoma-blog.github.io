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
            // 没有现成挂件时就地插入：优先接在播放器后，否则接在简介卡后
            var anchor = document.querySelector('.music-widget') || document.querySelector('.profile-widget');
            if (!anchor || !anchor.parentNode) return;
            card = document.createElement('div');
            card.className = 'widget card moments-widget';
            card.innerHTML = '<div class="moments-title">最新说说</div>' +
                '<a class="moment-item" target="_blank" rel="noopener">' +
                '<div class="moment-text"></div><div class="moment-date"></div></a>';
            anchor.parentNode.insertBefore(card, anchor.nextSibling);
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
        // 只有带侧栏的页面才拉取；播放器被隐藏后仍能正常工作
        if (!document.querySelector('.moments-widget') && !document.querySelector('.profile-widget')) return;
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
