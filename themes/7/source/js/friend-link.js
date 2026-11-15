(function () {
    "use strict";

    /* ---------------- Turnstile ---------------- */
    var rendered = false;

    function renderTurnstile() {
        var box = document.querySelector(".cf-turnstile");
        if (!box) { rendered = false; return; }
        if (typeof window.turnstile === "undefined" || rendered) return;
        try {
            window.turnstile.render(box, { sitekey: box.dataset.sitekey, theme: "light" });
            rendered = true;
        } catch (e) { /* 已渲染 */ }
    }

    function loadTurnstile() {
        if (!document.querySelector(".cf-turnstile")) return;
        if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
            renderTurnstile();
            return;
        }
        var s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.defer = true;
        s.onload = renderTurnstile;
        document.head.appendChild(s);
    }

    function resetTurnstile() {
        if (typeof window.turnstile !== "undefined" && rendered) {
            try { window.turnstile.reset(); } catch (e) {}
        }
    }

    /* ---------------- 提交 ---------------- */
    document.addEventListener("submit", function (e) {
        var form = document.getElementById("friend-link-form");
        if (!form || e.target !== form) return;
        e.preventDefault();

        var btn = document.getElementById("link-submit-btn");
        var msg = document.getElementById("link-form-msg");
        var ok = function (t) { msg.className = "links-form-msg success"; msg.textContent = t; };
        var bad = function (t) { msg.className = "links-form-msg error"; msg.textContent = t; };

        if (form.website && form.website.value) { bad("提交失败"); return; }

        var tsInput = form.querySelector('[name="cf-turnstile-response"]');
        if (document.querySelector(".cf-turnstile") && (!tsInput || !tsInput.value)) {
            bad("请先完成人机验证");
            return;
        }

        var data = {
            name: form.name.value.trim(),
            url: form.url.value.trim(),
            description: form.description.value.trim(),
            avatar: form.avatar.value.trim(),
            email: form.email.value.trim()
        };
        if (tsInput && tsInput.value) data["cf-turnstile-response"] = tsInput.value;

        if (!data.name || !data.url || !data.email) { bad("请填写所有必填项（站名、网址、邮箱）"); return; }

        try { new URL(data.url); } catch (err) {
            bad("网址格式不正确，请包含 http:// 或 https://");
            return;
        }

        btn.disabled = true;
        btn.textContent = "提交中...";
        msg.textContent = "";
        msg.className = "links-form-msg";

        fetch("/api/submit-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    ok("申请已提交！审核通过后将自动出现在友链墙。");
                    form.reset();
                } else {
                    bad((res && res.message) || "提交失败，请稍后重试");
                }
                resetTurnstile();
            })
            .catch(function () { bad("网络错误，请检查网络后重试"); })
            .then(function () {
                btn.disabled = false;
                btn.textContent = "提交申请";
            });
    });

    loadTurnstile();
})();
