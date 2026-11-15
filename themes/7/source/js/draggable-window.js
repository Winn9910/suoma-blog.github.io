
(function () {
    if (window.win7MakeDraggable) return;

    window.win7MakeDraggable = function (gadget, options) {
        options = options || {};
        var STORE_KEY = options.storeKey || 'win7-window-pos';
        var MOBILE_BP = options.breakpoint || 820;

        var titleBar = gadget && gadget.querySelector('.title-bar');
        if (!gadget || !titleBar) return;

        var isPCMode = function () { return window.innerWidth > MOBILE_BP; };

        function clampToViewport(left, top) {
            var rect = gadget.getBoundingClientRect();
            var maxLeft = Math.max(0, window.innerWidth - rect.width);
            var maxTop = Math.max(0, window.innerHeight - rect.height);
            return {
                left: Math.min(Math.max(0, left), maxLeft),
                top: Math.min(Math.max(0, top), maxTop)
            };
        }

        function applyPos(left, top) {
            var pos = clampToViewport(left, top);
            gadget.style.left = pos.left + 'px';
            gadget.style.top = pos.top + 'px';
            gadget.style.bottom = 'auto';
            gadget.style.right = 'auto';
        }

        function clearPos() {
            gadget.style.left = '';
            gadget.style.top = '';
            gadget.style.bottom = '';
            gadget.style.right = '';
        }

        function savePos() {
            try {
                localStorage.setItem(STORE_KEY, JSON.stringify({
                    left: parseFloat(gadget.style.left),
                    top: parseFloat(gadget.style.top)
                }));
            } catch (e) {  }
        }

        function restorePos() {
            if (!isPCMode()) return;
            try {
                var saved = JSON.parse(localStorage.getItem(STORE_KEY));
                if (saved && !isNaN(saved.left) && !isNaN(saved.top)) {
                    applyPos(saved.left, saved.top);
                }
            } catch (e) {  }
        }

        var dragging = false;
        var startX = 0, startY = 0, startLeft = 0, startTop = 0;

        titleBar.addEventListener('pointerdown', function (e) {
            if (!isPCMode()) return;
            if (e.target.closest('.title-bar-controls')) return;
            if (e.button !== undefined && e.button !== 0) return;

            var rect = gadget.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            startX = e.clientX;
            startY = e.clientY;
            dragging = true;
            gadget.classList.add('dragging');
            titleBar.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        titleBar.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            applyPos(startLeft + (e.clientX - startX), startTop + (e.clientY - startY));
        });

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            gadget.classList.remove('dragging');
            if (e && e.pointerId !== undefined && titleBar.hasPointerCapture(e.pointerId)) {
                titleBar.releasePointerCapture(e.pointerId);
            }
            savePos();
        }
        titleBar.addEventListener('pointerup', endDrag);
        titleBar.addEventListener('pointercancel', endDrag);

        titleBar.addEventListener('dblclick', function (e) {
            if (!isPCMode()) return;
            if (e.target.closest('.title-bar-controls')) return;
            clearPos();
            try { localStorage.removeItem(STORE_KEY); } catch (err) {  }
        });

        window.addEventListener('resize', function () {
            if (!isPCMode()) {
                clearPos();
            } else if (gadget.style.left) {
                applyPos(parseFloat(gadget.style.left), parseFloat(gadget.style.top));
            } else {
                restorePos();
            }
        });

        restorePos();
    };
})();
