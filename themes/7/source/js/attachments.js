
document.addEventListener('DOMContentLoaded', function () {
    var gadget = document.querySelector('.attach-gadget');
    if (!gadget) return;

    var toggleBtn = document.getElementById('attachToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            var collapsed = gadget.classList.toggle('collapsed');
            try {
                if (collapsed) localStorage.setItem('win7-attach-collapsed', '1');
                else localStorage.removeItem('win7-attach-collapsed');
            } catch (e) {  }
        });
    }

    if (window.win7MakeDraggable) {
        window.win7MakeDraggable(gadget, { storeKey: 'win7-attach-pos', breakpoint: 820 });
    }
});
