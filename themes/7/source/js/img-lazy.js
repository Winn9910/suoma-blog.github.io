

(function () {
    function apply() {
        var imgs = document.querySelectorAll('.article-content img');
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
            if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }
})();
