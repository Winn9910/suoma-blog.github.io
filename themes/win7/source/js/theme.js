/* win7 theme — vanilla JS for the Aero shell interactions.
   7.css ships no JS; this adds: code "Notepad" windows (copy = code only,
   no line numbers), Win7 context menu, reading-progress bar, tabs, window
   controls (min→floating restore, max / close→home), the sidebar display settings
   (font-size slider + line-number toggle) and a few component demos
   (theme-color radios, archive year filter). */
(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var win = document.getElementById("win7Window");
  var siteRoot = (win && win.getAttribute("data-home")) || "/";

  /* ---------------------------------------------------------------
   * Title-bar window controls: min / max / close (→ back to home)
   * ------------------------------------------------------------- */
  /* ---------------------------------------------------------------
   * Minimize → the window hides (display:none) and a floating
   * "restore" button appears bottom-right. Click it to bring the
   * window back. (No taskbar by design — keeps the clean desktop.)
   * ------------------------------------------------------------- */
  var restoreBtn = null;
  if (win) {
    var titleTxt = (($(".title-bar-text", win) || {}).textContent || "本站").trim();
    restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "win7-restorebtn";
    restoreBtn.hidden = true;
    restoreBtn.setAttribute("aria-label", "恢复窗口");
    restoreBtn.innerHTML = '<span class="ico ico-win"></span> <span class="win7-restore-lbl">' + esc(titleTxt) + "</span>";
    document.body.appendChild(restoreBtn);
    restoreBtn.addEventListener("click", function () {
      win.classList.remove("is-min");
      restoreBtn.hidden = true;
    });
  }

  if (win) {
    $all("[data-win]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = btn.getAttribute("data-win");
        if (act === "max") {
          win.classList.toggle("is-max");
          btn.classList.toggle("is-maximize", !win.classList.contains("is-max"));
          btn.classList.toggle("is-restore", win.classList.contains("is-max"));
        } else if (act === "min") {
          var minimized = win.classList.toggle("is-min");
          if (restoreBtn) restoreBtn.hidden = !minimized;
        } else if (act === "close") {
          location.href = siteRoot;
        }
      });
    });
  }

  /* ---------------------------------------------------------------
   * Tabs (home page view switcher)
   * ------------------------------------------------------------- */
  $all(".tabs").forEach(function (tabs) {
    var list = tabs.querySelector('[role="tablist"]');
    if (!list) return;
    list.addEventListener("click", function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (!tab || tab.disabled) return;
      var panelId = tab.getAttribute("aria-controls");
      $all('[role="tab"]', list).forEach(function (t) {
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
        t.setAttribute("tabindex", t === tab ? "0" : "-1");
      });
      $all('[role="tabpanel"]', tabs).forEach(function (p) { p.hidden = p.id !== panelId; });
    });
  });

  /* ---------------------------------------------------------------
   * Code blocks → Win7 "Notepad" windows with a copy button.
   * Copy grabs ONLY the code text (the .code cell / last <pre>),
   * never the line-number gutter.
   * ------------------------------------------------------------- */
  function codeText(el) {
    // Prefer the real code cell; fall back to the last <pre> (no gutter
    // builds) or the whole block. Never the first gutter <pre>.
    var pre = el.querySelector("td.code pre") ||
              el.querySelector(".code pre") ||
              el.querySelector("pre:last-of-type") ||
              el.querySelector("pre");
    return (pre ? pre.textContent : el.textContent).replace(/\n+$/, "");
  }
  function langOf(el) {
    var m = (el.className || "").match(/(?:highlight|language-)(\w[\w+-]*)/);
    return m ? m[1].toUpperCase() : "TEXT";
  }
  function wrapCode(el) {
    if (el.closest(".win7-codewin")) return;
    var lang = langOf(el);
    var wrap = document.createElement("section");
    wrap.className = "window win7-codewin";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", lang + " 代码");
    wrap.innerHTML =
      '<div class="title-bar">' +
        '<div class="title-bar-text"><span class="ico ico-doc"></span> ' + esc(lang) + ' — 记事本</div>' +
        '<div class="title-bar-controls">' +
          '<button class="win7-copy" type="button" aria-describedby="tip-copy">复制</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body win7-codebody"></div>';
    var body = wrap.querySelector(".win7-codebody");
    el.parentNode.insertBefore(wrap, el);
    body.appendChild(el);

    var btn = wrap.querySelector(".win7-copy");
    var tip = document.createElement("div");
    tip.id = "tip-copy"; tip.setAttribute("role", "tooltip"); tip.className = "is-bottom"; tip.hidden = true;
    tip.textContent = "复制代码（不含行号）";
    wrap.appendChild(tip);
    btn.addEventListener("mouseenter", function () { tip.hidden = false; });
    btn.addEventListener("mouseleave", function () { tip.hidden = true; });
    btn.addEventListener("click", function () {
      var txt = codeText(el);
      var done = function () {
        tip.hidden = false; tip.textContent = "已复制（不含行号）";
        setTimeout(function () { tip.hidden = true; tip.textContent = "复制代码（不含行号）"; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  }
  $all(".win7-content figure.highlight").forEach(wrapCode);
  $all(".win7-content pre").forEach(function (pre) {
    if (!pre.closest("figure.highlight") && !pre.closest(".win7-codewin")) wrapCode(pre);
  });

  /* ---------------------------------------------------------------
   * Reading progress bar (post pages) — native 7.css progressbar
   * ------------------------------------------------------------- */
  if ($(".win7-article") && win) {
    var main = document.getElementById("win7Main");
    if (main) {
      var bar = document.createElement("div");
      bar.className = "win7-readprog";
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-label", "阅读进度");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", "0");
      var fill = document.createElement("div");
      fill.style.transition = "width .08s linear";
      bar.appendChild(fill);
      main.insertBefore(bar, main.firstChild);
      var upd = function () {
        var d = document.documentElement;
        var max = d.scrollHeight - d.clientHeight;
        var p = max > 0 ? (d.scrollTop / max) * 100 : 0;
        fill.style.width = p + "%";
        bar.setAttribute("aria-valuenow", Math.round(p));
      };
      window.addEventListener("scroll", upd, { passive: true });
      window.addEventListener("resize", upd);
      upd();
    }
  }

  /* ---------------------------------------------------------------
   * Sidebar display settings: font-size slider + line-number toggle.
   * Both are persisted in localStorage so they survive reloads.
   * ------------------------------------------------------------- */
  var fs = document.getElementById("win7FontSize");
  var fsVal = document.getElementById("win7FsVal");
  var gut = document.getElementById("win7Gutter");
  function applyFs(v) {
    document.documentElement.style.setProperty("--win7-content-size", v + "px");
    if (fsVal) fsVal.textContent = v;
  }
  if (fs) {
    var savedFs = parseInt(localStorage.getItem("win7_fontsize"), 10);
    if (savedFs >= 13 && savedFs <= 20) { fs.value = savedFs; applyFs(savedFs); }
    fs.addEventListener("input", function () { applyFs(fs.value); localStorage.setItem("win7_fontsize", fs.value); });
  }
  if (gut) {
    var savedGut = localStorage.getItem("win7_gutter");
    if (savedGut === "0") { gut.checked = false; document.body.classList.add("no-gutter"); }
    gut.addEventListener("change", function () {
      document.body.classList.toggle("no-gutter", !gut.checked);
      localStorage.setItem("win7_gutter", gut.checked ? "1" : "0");
    });
  }

  /* ---------------------------------------------------------------
   * Archive year filter (combobox) — toggles list-view items
   * ------------------------------------------------------------- */
  var yrSel = document.getElementById("win7ArchiveYear");
  if (yrSel) {
    yrSel.addEventListener("change", function () {
      var y = yrSel.value;
      $all(".win7-archive-lv [role='option']").forEach(function (li) {
        li.hidden = y !== "all" && li.getAttribute("data-year") !== y;
      });
    });
  }

  /* Footer "back to top" command-link */
  var backTop = document.getElementById("win7BackTop");
  if (backTop) backTop.addEventListener("click", function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------------------------------------------------------------
   * Theme-color radios (About page demo) — live window tint
   * ------------------------------------------------------------- */
  var themeRadios = $all('input[name="w7theme"]');
  if (themeRadios.length && win) {
    var savedTheme = localStorage.getItem("win7_theme");
    if (savedTheme) {
      win.style.setProperty("--w7-w-bg", savedTheme);
      var rb = document.querySelector('input[name="w7theme"][value="' + savedTheme + '"]');
      if (rb) rb.checked = true;
    }
    themeRadios.forEach(function (r) {
      r.addEventListener("change", function () {
        if (r.checked) {
          win.style.setProperty("--w7-w-bg", r.value);
          localStorage.setItem("win7_theme", r.value);
        }
      });
    });
  }

  /* ---------------------------------------------------------------
   * Win7-style context menu — reuses 7.css native [role=menu]
   * ------------------------------------------------------------- */
  var ctx = document.createElement("ul");
  ctx.setAttribute("role", "menu");
  ctx.className = "win7-ctxmenu";
  ctx.hidden = true;
  ctx.setAttribute("aria-label", "快捷菜单");
  ctx.innerHTML =
    '<li role="menuitem"><button type="button" data-act="top"><span class="ico ico-up"></span> 回到顶部</button></li>' +
    '<li role="menuitem"><button type="button" data-act="refresh"><span class="ico ico-refresh"></span> 刷新本页</button></li>' +
    '<li role="menuitem"><button type="button" data-act="copy"><span class="ico ico-doc"></span> 复制本页链接</button></li>' +
    '<li role="menuitem" class="has-divider"><button type="button" data-act="about"><span class="ico ico-win"></span> 关于本站</button></li>';
  document.body.appendChild(ctx);

  function closeCtx() { ctx.hidden = true; }
  function openCtx(x, y) {
    ctx.hidden = false;
    var w = ctx.offsetWidth, h = ctx.offsetHeight;
    var nx = Math.min(x, window.innerWidth - w - 6);
    var ny = Math.min(y, window.innerHeight - h - 6);
    ctx.style.left = Math.max(6, nx) + "px";
    ctx.style.top = Math.max(6, ny) + "px";
  }
  document.addEventListener("contextmenu", function (e) {
    if (e.target.closest("input, textarea, [contenteditable], a")) return;
    e.preventDefault();
    openCtx(e.clientX, e.clientY);
  });
  document.addEventListener("click", function (e) { if (!ctx.hidden && !ctx.contains(e.target)) closeCtx(); });
  document.addEventListener("scroll", closeCtx, { passive: true });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCtx(); });
  ctx.addEventListener("click", function (e) {
    var item = e.target.closest("[data-act]");
    if (!item) return;
    var act = item.getAttribute("data-act");
    if (act === "top") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (act === "refresh") location.reload();
    else if (act === "copy") { if (navigator.clipboard) navigator.clipboard.writeText(location.href).catch(function () {}); }
    else if (act === "about") { location.href = siteRoot + "about/"; }
    closeCtx();
  });
})();
