/* 便签挂件：折叠 + 拖拽（复用 win7MakeDraggable），并避开附件浮窗 */
(function () {
    var gadget = document.querySelector('.note-gadget');
    if (!gadget) return;

    var btn = document.getElementById('noteToggle');
    if (btn) {
        btn.addEventListener('click', function () {
            var collapsed = gadget.classList.toggle('collapsed');
            try {
                if (collapsed) localStorage.setItem('win7-note-collapsed', '1');
                else localStorage.removeItem('win7-note-collapsed');
            } catch (e) { }
        });
    }

    if (window.win7MakeDraggable) {
        window.win7MakeDraggable(gadget, { storeKey: 'win7-note-pos', breakpoint: 820 });
    }

    /* 附件浮窗存在时，把便签垫到它上方，避免右下角重叠 */
    var attach = document.querySelector('.attach-gadget');
    if (attach && attach.offsetHeight && !gadget.style.top) {
        gadget.style.bottom = (attach.offsetHeight + 44) + 'px';
    }
})();
