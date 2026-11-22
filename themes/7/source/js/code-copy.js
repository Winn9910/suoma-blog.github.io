
/* 代码块一键复制：给文章里的每个 <pre> 右上角加按钮，点击复制代码文本 */
(function () {
    'use strict';

    var content = document.querySelector('.post-content');
    if (!content) return;

    function legacyCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    function copyText(text, done) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {
                legacyCopy(text);
                done();
            });
        } else {
            legacyCopy(text);
            done();
        }
    }

    /* Hexo 高亮引擎把每行包在 <span class="line"> 里（行间只有 <br>），
       直接取 textContent 会丢换行——按行拼接才是真实代码 */
    function extractCode(pre) {
        var lines = pre.querySelectorAll('.line');
        if (lines.length) {
            var out = [];
            [].forEach.call(lines, function (l) {
                out.push(l.textContent.replace(/\r/g, ''));   /* Windows CRLF 行尾残留 */
            });
            return out.join('\n').replace(/\n+$/, '');
        }
        return pre.textContent.replace(/\r/g, '').replace(/\n$/, '');
    }

    [].slice.call(content.querySelectorAll('pre')).forEach(function (pre) {
        if (pre.parentElement && pre.parentElement.classList.contains('code-copy-wrap')) return;
        var wrap = document.createElement('div');
        wrap.className = 'code-copy-wrap';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'code-copy-btn';
        btn.textContent = '复制';
        btn.setAttribute('aria-label', '复制代码');
        wrap.appendChild(btn);

        btn.addEventListener('click', function () {
            copyText(extractCode(pre), function () {
                btn.textContent = '已复制';
                btn.classList.add('is-done');
                setTimeout(function () {
                    btn.textContent = '复制';
                    btn.classList.remove('is-done');
                }, 1500);
            });
        });
    });
})();
