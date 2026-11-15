(function () {
    // ============ Turnstile 渲染 ============
    var turnstileRendered = false;

    function renderTurnstile() {
        var widget = document.querySelector('.cf-turnstile');
        if (!widget) { turnstileRendered = false; return; }
        if (typeof window.turnstile === 'undefined') return;
        if (turnstileRendered) return;
        try {
            window.turnstile.render(widget, {
                sitekey: widget.dataset.sitekey,
                theme: 'light'
            });
            turnstileRendered = true;
        } catch (e) { /* 已渲染 */ }
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

    if (document.querySelector('.cf-turnstile')) {
        loadTurnstileApi();
    }

    // ============ 表单提交 ============
    document.addEventListener('submit', async function (e) {
        var form = document.getElementById('friend-link-form');
        if (!form || e.target !== form) return;

        e.preventDefault();

        var btn = document.getElementById('link-submit-btn');
        var msg = document.getElementById('link-form-msg');
        var MSG = 'win7-link-form-msg';

        // honeypot 检查 - 如果隐藏字段被填了说明是机器人
        if (form.website && form.website.value) {
            msg.className = MSG + ' error';
            msg.textContent = '提交失败';
            return;
        }

        // Turnstile 人机验证检查（若站点已启用）
        var tsInput = form.querySelector('[name="cf-turnstile-response"]');
        if (document.querySelector('.cf-turnstile')) {
            if (!tsInput || !tsInput.value) {
                msg.className = MSG + ' error';
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
            msg.className = MSG + ' error';
            msg.textContent = '请填写所有必填项（站名、网址、邮箱）';
            return;
        }

        try {
            new URL(data.url);
        } catch {
            msg.className = MSG + ' error';
            msg.textContent = '网址格式不正确，请包含 http:// 或 https://';
            return;
        }

        btn.disabled = true;
        btn.textContent = '提交中...';
        msg.textContent = '';
        msg.className = MSG;

        try {
            var resp = await fetch('/api/submit-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            var result = await resp.json();

            if (result.ok) {
                msg.className = MSG + ' success';
                msg.textContent = '申请已提交！审核通过后将自动出现在友链列表中。';
                form.reset();
                resetTurnstile();
            } else {
                msg.className = MSG + ' error';
                msg.textContent = result.message || '提交失败，请稍后重试';
                resetTurnstile();
            }
        } catch (err) {
            msg.className = MSG + ' error';
            msg.textContent = '网络错误，请检查网络后重试';
        }

        btn.disabled = false;
        btn.textContent = '提交申请';
    });

    function resetTurnstile() {
        if (typeof window.turnstile !== 'undefined' && turnstileRendered) {
            try { window.turnstile.reset(); } catch (e) {}
        }
    }
})();
