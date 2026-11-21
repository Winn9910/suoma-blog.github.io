
/* 文章目录导航（Win7 导航窗格风格）：
   长文章右侧浮现玻璃窗，滚动高亮当前章节，点击平滑跳转。
   仅在文章页、标题数 ≥3、屏宽 ≥1200px 时出现。 */
(function () {
    'use strict';

    var content = document.querySelector('.post-content');
    if (!content) return;                       /* 只在文章页 */

    var headings = [].slice.call(content.querySelectorAll('h2, h3'));
    if (headings.length < 3) return;            /* 太短不值得导航 */

    /* 生成树数据（缺 id 就补） */
    var tree = [];
    headings.forEach(function (h, i) {
        if (!h.id) h.id = 'toc-' + i;
        var node = { el: h, id: h.id, text: h.textContent.trim(), level: +h.tagName.substring(1) };
        if (node.level === 2 || !tree.length) {
            tree.push({ node: node, children: [] });
        } else {
            tree[tree.length - 1].children.push(node);
        }
    });

    /* ---------- 组装 DOM ---------- */
    var win = document.createElement('div');
    win.className = 'window glass toc-window';
    win.hidden = true;

    var bar = document.createElement('div');
    bar.className = 'title-bar';
    bar.innerHTML = '<div class="title-bar-text">导航窗格</div>';
    win.appendChild(bar);

    var body = document.createElement('div');
    body.className = 'window-body toc-body';

    var ul = document.createElement('ul');
    ul.className = 'toc-list';
    tree.forEach(function (group) {
        var li = document.createElement('li');
        li.className = 'toc-lv1';
        var a = document.createElement('a');
        a.href = '#' + group.node.id;
        a.textContent = group.node.text;
        li.appendChild(a);
        if (group.children.length) {
            var sub = document.createElement('ul');
            group.children.forEach(function (c) {
                var li2 = document.createElement('li');
                li2.className = 'toc-lv2';
                var a2 = document.createElement('a');
                a2.href = '#' + c.id;
                a2.textContent = c.text;
                li2.appendChild(a2);
                sub.appendChild(li2);
            });
            li.appendChild(sub);
        }
        ul.appendChild(li);
    });
    body.appendChild(ul);
    win.appendChild(body);
    document.body.appendChild(win);

    /* ---------- 显示条件 ---------- */
    var links = [].slice.call(win.querySelectorAll('a[href^="#"]'));

    function refresh() {
        win.hidden = !(window.innerWidth >= 1200);
    }
    refresh();
    window.addEventListener('resize', refresh);

    /* ---------- 点击：平滑滚动 ---------- */
    links.forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.getElementById(a.getAttribute('href').slice(1));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* ---------- 滚动高亮 ---------- */
    var current = -1;
    function highlight() {
        var mark = window.scrollY + 130;
        var idx = -1;
        for (var i = 0; i < tree.length; i++) {
            if (tree[i].node.el.offsetTop <= mark) idx = i;
        }
        if (idx !== current) {
            current = idx;
            links.forEach(function (a, i) {
                a.classList.toggle('is-active', i === idx);
            });
        }
    }
    window.addEventListener('scroll', highlight, { passive: true });
    highlight();
})();
