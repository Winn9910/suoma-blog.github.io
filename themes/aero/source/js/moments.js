(function () {
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
        card.querySelector('.moment-text').textContent = m.text;
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
