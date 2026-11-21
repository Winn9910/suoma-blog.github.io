
/* 伪地址栏：双击地址栏进入编辑模式，回车解析路径。
   认识的路径直接跳转；不认识的弹 Win7「Windows 找不到文件」错误框。 */
(function () {
    'use strict';

    var bar = document.querySelector('.locationbar');
    var crumbs = document.getElementById('nav-breadcrumbs');
    if (!bar || !crumbs) return;

    var HOME = 'C:\\Users\\盒子君\\Documents';

    /* ---------- 伪路径 ---------- */
    function fakePath() {
        var p = location.pathname;
        if (p === '/') return HOME;
        var name = p.replace(/^\/+|\/+$/g, '').replace(/\//g, '\\');
        var isPost = document.querySelector('.post-content') && /^\/\d+\/$/.test(p);
        return HOME + '\\' + name + (isPost ? '.md' : '');
    }

    /* ---------- 编辑模式 ---------- */
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'addr-input';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.placeholder = '输入路径，如 C:\\about 或文章编号 99';
    input.hidden = true;
    bar.appendChild(input);

    function enterEdit() {
        if (window.innerWidth <= 820) return;   /* 手机屏小，双击易误触 */
        input.value = fakePath();
        crumbs.style.visibility = 'hidden';
        input.hidden = false;
        input.focus();
        input.select();
    }

    function exitEdit() {
        input.hidden = true;
        crumbs.style.visibility = '';
    }

    bar.addEventListener('dblclick', enterEdit);

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') { exitEdit(); e.preventDefault(); }
        else if (e.key === 'Enter') {
            var url = parse(input.value);
            if (url) {
                if (window.__win7ShowLoading) window.__win7ShowLoading();
                location.href = url;
            } else {
                showNotFound(input.value.trim());
            }
        }
    });
    input.addEventListener('blur', exitEdit);

    /* ---------- 路径解析 ---------- */
    function parse(v) {
        if (!v) return null;
        v = v.trim().replace(/^C:\\+|C:\/+/i, '').replace(/^\\+|^\/+/, '');
        v = v.replace(/\.html?$/i, '').replace(/\\+$/, '');
        var map = {
            '': '/', 'home': '/', '主页': '/', '首页': '/', 'desktop': '/', '桌面': '/',
            'about': '/about/', '关于': '/about/', '关于我': '/about/',
            'links': '/links/', '友链': '/links/', '朋友们': '/links/',
            'tags': '/tags/', '标签': '/tags/',
            'archives': '/archives/', '归档': '/archives/', '文章': '/archives/'
        };
        var key = v.toLowerCase().replace(/\/+$/, '');
        if (key in map) return map[key];
        if (/^\d+$/.test(v)) return '/' + v + '/';   /* 文章编号 */
        return null;
    }

    /* ---------- 「Windows 找不到文件」错误框 ---------- */
    var layer = null;
    function buildError() {
        layer = document.createElement('div');
        layer.className = 'file-error-layer';
        layer.hidden = true;
        layer.innerHTML =
            '<div class="window file-error-win active">' +
              '<div class="title-bar"><div class="title-bar-text">文件操作</div>' +
              '<div class="title-bar-controls"><button aria-label="Close" id="feClose" tabindex="-1"></button></div></div>' +
              '<div class="window-body fe-body">' +
                '<svg class="fe-icon" viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">' +
                  '<circle cx="16" cy="16" r="14.5" fill="#e23a3a" stroke="#a91f1f"/>' +
                  '<path stroke="#fff" stroke-width="3.2" stroke-linecap="round" d="M10 10l12 12M22 10 10 22"/>' +
                '</svg>' +
                '<p class="fe-text">Windows 找不到 \'<span id="feName"></span>\'。请确定文件名是否正确后，再试一次。</p>' +
              '</div>' +
              '<div class="fe-actions"><button type="button" id="feOk" class="uac-default">确定</button></div>' +
            '</div>';
        document.body.appendChild(layer);

        layer.addEventListener('click', function (e) {
            if (e.target === layer || e.target.id === 'feOk' || e.target.id === 'feClose') hideError();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !layer.hidden) hideError();
        });
    }

    function showNotFound(name) {
        if (!layer) buildError();
        var span = document.getElementById('feName');
        if (span) span.textContent = name || '';
        layer.hidden = false;
        var ok = document.getElementById('feOk');
        if (ok) ok.focus();
    }

    function hideError() {
        if (layer) layer.hidden = true;
        input.focus();
        input.select();
    }
})();
