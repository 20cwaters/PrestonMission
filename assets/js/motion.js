/* ============================================================
   Motion — scroll reveals, counting numbers, header state,
   and the mobile nav sheet.

   Everything here is progressive: if this file never loads, or the
   browser has no IntersectionObserver, the page still renders fully.
   Nothing is hidden by CSS that this script is required to un-hide —
   the .reveal class is removed from the document if motion is off.
   ============================================================ */

(function () {
  "use strict";

  var reduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ---------------- scroll reveals ---------------- */

  var seen = "__revealed";

  function showNow(el) {
    el.classList.add("is-in");
    el[seen] = true;
  }

  var io = null;
  if (!reduced && "IntersectionObserver" in window) {
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          showNow(entry.target);
          io.unobserve(entry.target);
          runEffects(entry.target);
        });
      },
      // Fire a little before the element reaches the bottom edge, so things
      // have finished arriving by the time they are properly in view.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
  }

  /* ---------------- counting numbers ---------------- */

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-count-suffix") || "";
    if (reduced) { el.textContent = Math.round(target) + suffix; return; }

    var dur = Math.min(1500, 450 + Math.abs(target) * 1.1);
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      el.textContent = Math.round(target * easeOut(t)) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    el.textContent = "0" + suffix;
    requestAnimationFrame(frame);
  }

  /* ---------------- effects attached to a revealed element ---------------- */

  function runEffects(root) {
    if (root.hasAttribute && root.hasAttribute("data-count-to")) countUp(root);
    var counters = root.querySelectorAll ? root.querySelectorAll("[data-count-to]") : [];
    for (var i = 0; i < counters.length; i++) countUp(counters[i]);

    var bars = root.querySelectorAll ? root.querySelectorAll("[data-bar-to]") : [];
    for (var j = 0; j < bars.length; j++) {
      (function (bar) {
        var pct = parseFloat(bar.getAttribute("data-bar-to")) || 0;
        // one frame's delay so the transition has a 0 to animate from
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { bar.style.width = pct + "%"; });
        });
      })(bars[j]);
    }
  }

  /* ---------------- scanning ---------------- */

  // Page scripts inject most of the content after DOMContentLoaded, so this
  // runs repeatedly and is safe to call as often as you like.
  function scan() {
    var els = document.querySelectorAll(".reveal");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el[seen]) continue;

      if (!io) { showNow(el); runEffects(el); continue; }

      // Anything already on screen at load shows immediately rather than
      // animating in behind the fold.
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
        showNow(el);
        runEffects(el);
      } else {
        el[seen] = false;
        io.observe(el);
      }
    }
  }

  /* ---------------- header state ---------------- */

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return false;

    var ticking = false;
    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
    return true;
  }

  /* ---------------- nav sheet ---------------- */

  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    if (!nav || !toggle) return false;

    var backdrop = document.querySelector(".nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      document.body.appendChild(backdrop);
    }

    function close() {
      nav.classList.remove("open");
      sync();
      toggle.setAttribute("aria-expanded", "false");
    }

    // site.js owns the toggling; this mirrors whatever state it lands on.
    function sync() {
      var open = nav.classList.contains("open");
      backdrop.classList.toggle("open", open);
      document.body.classList.toggle("is-locked", open);
    }

    new MutationObserver(sync).observe(nav, {
      attributes: true,
      attributeFilter: ["class"]
    });

    backdrop.addEventListener("click", close);
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) close();
    });

    sync();
    return true;
  }

  /* ---------------- boot ---------------- */

  function boot() {
    // site.js builds the header on DOMContentLoaded too; retry briefly in case
    // this file won the race.
    if (!initHeader() || !initNav()) {
      var tries = 0;
      var t = setInterval(function () {
        if ((initHeader() && initNav()) || ++tries > 20) clearInterval(t);
      }, 50);
    }
    scan();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // after every other DOMContentLoaded handler has injected its content
      setTimeout(boot, 0);
    });
  } else {
    setTimeout(boot, 0);
  }

  window.addEventListener("load", scan);

  window.MOTION = { scan: scan, reduced: reduced };
})();
