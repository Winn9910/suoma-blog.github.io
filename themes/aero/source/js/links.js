(function () {
    // ============ Turnstile 渲染（兼容 PJAX） ============
    var TURNSTILE_SITE_KEY = document.querySelector('.cf-turnstile');
    var turnstileRendered = false;

    function renderTurnstile() {
        var widget = document.querySelector('.cf-turnstile');
        if (!widget) { turnstileRendered = false; return; }
        if (typeof window.turnstile === 'undefined') return; // api.js 未加载完
        if (turnstileRendered) return;
        try {
            window.turnstile.render(widget, {
                sitekey: widget.dataset.sitekey,
                theme: 'light'
            });
            turnstileRendered = true;
        } catch (e) { /* 已渲染或容器不存在 */ }
    }

    function loadTurnstileApi() {
        if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) return;
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.defer = true;
        s.onload = renderTurnstile;
        document.head.appendChild(s);
    }

    if (TURNSTILE_SITE_KEY && TURNSTILE_SITE_KEY.dataset.sitekey) {
        loadTurnstileApi();
        // PJAX 跳转回友链页后重新渲染
        document.addEventListener('pjax:complete', function () {
            setTimeout(renderTurnstile, 100);
        });
    }

    // ============ 表单提交 ============
    // 使用事件委托，兼容 PJAX 无刷新导航
    document.addEventListener('submit', async function (e) {
        var form = document.getElementById('friend-link-form');
        if (!form || e.target !== form) return;

        e.preventDefault();

        var btn = document.getElementById('link-submit-btn');
        var msg = document.getElementById('link-form-msg');

        // honeypot 检查 - 如果隐藏字段被填了说明是机器人
        if (form.website && form.website.value) {
            msg.className = 'link-form-msg error';
            msg.textContent = '提交失败';
            return;
        }

        // Turnstile 人机验证检查（若站点已启用）
        var tsInput = form.querySelector('[name="cf-turnstile-response"]');
        if (document.querySelector('.cf-turnstile')) {
            if (!tsInput || !tsInput.value) {
                msg.className = 'link-form-msg error';
                msg.textContent = '请先完成人机验证';
                return;
            }
        }

        var data = {
            name: form.name.value.trim(),
            url: form.url.value.trim(),
            description: form.description.value.trim(),
            avatar: form.avatar.value.trim(),
            email: form.email.value.trim()
        };
        if (tsInput && tsInput.value) {
            data['cf-turnstile-response'] = tsInput.value;
        }

        // 基础校验
        if (!data.name || !data.url || !data.email) {
            msg.className = 'link-form-msg error';
            msg.textContent = '请填写所有必填项（站名、网址、邮箱）';
            return;
        }

        // 简单的网址格式校验
        try {
            new URL(data.url);
        } catch {
            msg.className = 'link-form-msg error';
            msg.textContent = '网址格式不正确，请包含 http:// 或 https://';
            return;
        }

        btn.disabled = true;
        btn.textContent = '提交中...';
        msg.textContent = '';
        msg.className = 'link-form-msg';

        try {
            var resp = await fetch('/api/submit-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            var result = await resp.json();

            if (result.ok) {
                msg.className = 'link-form-msg success';
                msg.textContent = '申请已提交！审核通过后将自动出现在友链列表中。';
                form.reset();
                // 重置 Turnstile 以便下次提交
                if (typeof window.turnstile !== 'undefined' && turnstileRendered) {
                    try { window.turnstile.reset(); } catch (e) {}
                }
            } else {
                msg.className = 'link-form-msg error';
                msg.textContent = result.message || '提交失败，请稍后重试';
                if (typeof window.turnstile !== 'undefined' && turnstileRendered) {
                    try { window.turnstile.reset(); } catch (e) {}
                }
            }
        } catch (err) {
            msg.className = 'link-form-msg error';
            msg.textContent = '网络错误，请检查网络后重试';
        }

        btn.disabled = false;
        btn.textContent = '提交申请';
    });
})();
