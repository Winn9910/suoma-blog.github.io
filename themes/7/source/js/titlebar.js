/* 标题栏三键：只保留 Win7 的悬停 / 按下视觉效果，不做任何功能动作。
   桌面端由 7.css 的 :hover / :active 原生驱动；
   iOS 等移动端不派发 :active，这里补一个 .is-press 类让点按也有反馈。 */
(function () {
    "use strict";

    var win = document.querySelector(".main-window");
    if (!win) return;

    document.addEventListener(
        "touchstart",
        function (e) {
            var btn = e.target.closest(".title-bar-controls button");
            if (!btn || !win.contains(btn)) return;
            btn.classList.add("is-press");
            window.setTimeout(function () {
                btn.classList.remove("is-press");
            }, 220);
        },
        { passive: true }
    );
})();
