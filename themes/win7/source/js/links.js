(function () {
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

        var data = {
            name: form.name.value.trim(),
            url: form.url.value.trim(),
            description: form.description.value.trim(),
            avatar: form.avatar.value.trim(),
            email: form.email.value.trim()
        };

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
            } else {
                msg.className = 'link-form-msg error';
                msg.textContent = result.message || '提交失败，请稍后重试';
            }
        } catch (err) {
            msg.className = 'link-form-msg error';
            msg.textContent = '网络错误，请检查网络后重试';
        }

        btn.disabled = false;
        btn.textContent = '提交申请';
    });
})();
