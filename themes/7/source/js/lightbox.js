(function () {
    "use strict";

    var overlay = null, imgEl = null;

    function build() {
        overlay = document.createElement("div");
        overlay.className = "lightbox-overlay";
        overlay.hidden = true;

        imgEl = document.createElement("img");
        imgEl.className = "lightbox-img";
        imgEl.alt = "";

        var hint = document.createElement("span");
        hint.className = "lightbox-hint";
        hint.textContent = "点击任意处或按 Esc 关闭";

        overlay.appendChild(imgEl);
        overlay.appendChild(hint);
        overlay.addEventListener("click", close);
        document.body.appendChild(overlay);

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") close();
        });
    }

    function open(src, alt) {
        if (!overlay) build();
        imgEl.src = src;
        imgEl.alt = alt || "";
        overlay.hidden = false;
        document.body.style.overflow = "hidden";
        requestAnimationFrame(function () { overlay.classList.add("show"); });
    }

    function close() {
        if (!overlay || overlay.hidden) return;
        overlay.classList.remove("show");
        document.body.style.overflow = "";
        window.setTimeout(function () {
            overlay.hidden = true;
            imgEl.src = "";
        }, 200);
    }

    document.addEventListener("click", function (e) {
        var img = e.target.closest ? e.target.closest(".post-content img") : null;
        if (!img) return;
        if (img.closest("a")) return;          // 被链接包裹的图保持原行为
        if (img.classList.contains("link-logo")) return;
        e.preventDefault();
        open(img.currentSrc || img.src, img.alt);
    });
})();
