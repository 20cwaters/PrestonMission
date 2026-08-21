/* ============================================================
   Shared site engine: header/footer, date math, letters, photos.
   Loaded on every page after the data files.
   ============================================================ */

(function () {
  "use strict";

  var M = window.MISSION;
  var LETTERS = (window.LETTERS || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  var PHOTOS = (window.PHOTOS || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  /* ---------------- helpers ---------------- */

  function d(str) { return str ? new Date(str + "T12:00:00") : null; }
  function today() { var t = new Date(); t.setHours(12, 0, 0, 0); return t; }
  function days(from, to) { return Math.round((to - from) / 86400000); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function fmtDate(str, style) {
    var dt = d(str);
    if (!dt) return "";
    var opts = style === "short"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" };
    return dt.toLocaleDateString("en-US", opts);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  /* ---------------- mission status ---------------- */

  function status() {
    var now = today();
    var start = d(M.dates.mtcStart);
    var end = d(M.dates.release);
    var total = days(start, end);
    var out = clamp(days(start, now), 0, total);
    var left = clamp(days(now, end), 0, total);

    // years / months / days breakdown since start
    var y = now.getFullYear() - start.getFullYear();
    var mo = now.getMonth() - start.getMonth();
    var dd = now.getDate() - start.getDate();
    if (dd < 0) { mo -= 1; dd += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (mo < 0) { y -= 1; mo += 12; }
    if (y < 0) { y = mo = dd = 0; }

    var area = null;
    for (var i = 0; i < M.areas.length; i++) if (M.areas[i].current) area = M.areas[i];
    if (!area && M.areas.length) area = M.areas[M.areas.length - 1];

    var st = {
      daysOut: out,
      daysLeft: left,
      percent: total > 0 ? clamp((out / total) * 100, 0, 100) : 0,
      years: y, months: mo, days: dd,
      area: area,
      inMtc: !!(area && area.type === "mtc"),
      mtcWeek: Math.floor(out / 7) + 1,
      transfer: null,
      transferWeek: null,
      nextTransfer: null,
      untilManila: M.dates.manilaMtcStart ? days(now, d(M.dates.manilaMtcStart)) : null
    };

    if (M.dates.fieldStart) {
      var since = days(d(M.dates.fieldStart), now);
      if (since >= 0) {
        var len = (M.dates.transferLength || 6) * 7;
        st.transfer = Math.floor(since / len) + 1;
        st.transferWeek = Math.floor((since % len) / 7) + 1;
        var next = d(M.dates.fieldStart);
        next.setDate(next.getDate() + len * st.transfer);
        st.nextTransfer = next;
      }
    }
    return st;
  }

  /* ---------------- header & footer ---------------- */

  var NAV = [
    { href: "index.html", label: "Home" },
    { href: "letters.html", label: "Letters" },
    { href: "thoughts.html", label: "Spiritual Thoughts" },
    { href: "photos.html", label: "Photos" },
    { href: "map.html", label: "Where He Is" },
    { href: "about.html", label: "About & Write Him" }
  ];

  var SUN = '<svg class="brand__sun" viewBox="0 0 100 100" aria-hidden="true">' +
    '<circle cx="50" cy="50" r="20" fill="#d4952c"/>' +
    '<g stroke="#d4952c" stroke-width="6" stroke-linecap="round">' +
    '<line x1="50" y1="6" x2="50" y2="24"/><line x1="50" y1="76" x2="50" y2="94"/>' +
    '<line x1="6" y1="50" x2="24" y2="50"/><line x1="76" y1="50" x2="94" y2="50"/>' +
    '<line x1="19" y1="19" x2="32" y2="32"/><line x1="68" y1="68" x2="81" y2="81"/>' +
    '<line x1="19" y1="81" x2="32" y2="68"/><line x1="68" y1="32" x2="81" y2="19"/></g></svg>';

  function renderChrome() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page === "") page = "index.html";

    var header = document.querySelector("[data-site-header]");
    if (header) {
      header.className = "site-header";
      header.innerHTML =
        '<div class="wrap site-header__inner">' +
          '<a class="brand" href="index.html">' + SUN +
            '<span>' + esc(M.missionary.fullName) +
              '<small>' + esc(M.mission.name) + '</small>' +
            '</span>' +
          '</a>' +
          '<button class="nav-toggle" aria-label="Menu" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M3 6h18M3 12h18M3 18h18"/></svg></button>' +
          '<nav class="nav">' + NAV.map(function (n) {
            return '<a href="' + n.href + '"' + (n.href === page ? ' aria-current="page"' : '') + '>' + n.label + '</a>';
          }).join("") + '</nav>' +
        '</div>';

      var btn = header.querySelector(".nav-toggle");
      var nav = header.querySelector(".nav");
      btn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
      });
    }

    var footer = document.querySelector("[data-site-footer]");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML =
        '<div class="wrap">' +
          '<div class="footer-grid">' +
            '<div>' +
              '<h4>' + esc(M.missionary.fullName) + '</h4>' +
              '<p style="margin-bottom:.6em">' + esc(M.mission.name) + '<br>' +
                fmtDate(M.dates.mtcStart, "short") + ' &ndash; ' + fmtDate(M.dates.release, "short") + '</p>' +
              '<p><a href="mailto:' + esc(M.missionary.email) + '">' + esc(M.missionary.email) + '</a></p>' +
            '</div>' +
            '<div>' +
              '<h4>Follow along</h4>' +
              '<ul class="footer-links">' + NAV.map(function (n) {
                return '<li><a href="' + n.href + '">' + n.label + '</a></li>';
              }).join("") + '</ul>' +
            '</div>' +
            '<div>' +
              '<h4>More</h4>' +
              '<ul class="footer-links">' +
                '<li><a href="' + esc(M.links.googlePhotos) + '" target="_blank" rel="noopener">Google Photos album</a></li>' +
                '<li><a href="about.html#write">How to write him</a></li>' +
                '<li><a href="admin.html">Add a new letter</a></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="footer-bottom">' +
            '<span>Made by his family so nobody misses a week.</span>' +
            '<span>Last updated ' + fmtDate(LETTERS.length ? LETTERS[0].date : M.dates.mtcStart, "short") + '</span>' +
          '</div>' +
        '</div>';
    }
  }

  /* ---------------- letters ---------------- */

  function excerpt(letter, n) {
    var first = "";
    for (var i = 0; i < letter.body.length; i++) {
      if (letter.body[i].type === "p") { first = letter.body[i].text; break; }
    }
    n = n || 190;
    return first.length > n ? first.slice(0, n).replace(/\s+\S*$/, "") + "…" : first;
  }

  function letterMeta(l) {
    return '<div class="letter-card__meta">' +
      '<span class="pill">Week ' + esc(l.week) + '</span>' +
      '<span>' + fmtDate(l.date) + '</span>' +
      '<span>&middot;</span><span>' + esc(l.location) + '</span>' +
      '</div>';
  }

  function letterCard(l) {
    return '<a class="letter-card" href="letters.html#' + esc(l.id) + '">' +
      letterMeta(l) +
      '<h3>' + esc(l.title) + '</h3>' +
      '<p class="letter-card__excerpt">' + esc(excerpt(l)) + '</p>' +
      '</a>';
  }

  function letterBodyHtml(l) {
    return l.body.map(function (b) {
      if (b.type === "scripture") {
        return '<blockquote class="scripture">' +
          b.text.split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
          (b.ref ? '<cite>' + esc(b.ref) + '</cite>' : '') +
          '</blockquote>';
      }
      return '<p>' + esc(b.text) + '</p>';
    }).join("");
  }

  /* ---------------- photos ---------------- */

  function photosFor(letterId) {
    return PHOTOS.filter(function (p) { return p.letterId === letterId; });
  }

  // Grids load the small version; the lightbox loads the full one.
  // See automation/optimize-photos.mjs.
  function thumbSrc(p) {
    return p.src.replace(/^photos\//, "photos/thumbs/");
  }

  function photoTile(p, index) {
    return '<button class="photo" data-photo-index="' + index + '" type="button">' +
      '<img src="' + esc(thumbSrc(p)) + '" data-full="' + esc(p.src) + '" ' +
        'alt="' + esc(p.caption) + '" loading="lazy" decoding="async">' +
      '<span class="photo__ph" style="display:none">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
        '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/>' +
        '<path d="M21 15l-5-5L5 19"/></svg>' +
        '<strong>' + esc(p.caption) + '</strong>' +
        '<code>' + esc(p.src.replace("photos/", "")) + '</code>' +
      '</span>' +
      '<span class="photo__cap">' + esc(p.caption) + '</span>' +
      '</button>';
  }

  // If the thumbnail is missing (photo added by hand, optimizer not run yet),
  // fall back to the full image before giving up and showing the placeholder.
  function handleImageFallback(img) {
    if (img.dataset.full && img.src.indexOf("/thumbs/") !== -1) {
      img.src = img.dataset.full;
      return;
    }
    img.style.display = "none";
    var ph = img.nextElementSibling;
    if (ph) ph.style.display = "flex";
  }

  function renderPhotoGrid(el, list) {
    if (!list.length) {
      el.innerHTML = '<p class="muted">No photos yet.</p>';
      return;
    }
    el.innerHTML = list.map(photoTile).join("");
    el.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () { handleImageFallback(img); });
      if (img.complete && img.naturalWidth === 0) handleImageFallback(img);
    });
    el.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-photo-index]");
      if (btn) openLightbox(list, Number(btn.getAttribute("data-photo-index")));
    });
  }

  /* ---------------- lightbox ---------------- */

  var lb, lbList = [], lbIdx = 0;

  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lightbox__close" aria-label="Close">&times;</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">&#8249;</button>' +
      '<button class="lightbox__nav lightbox__nav--next" aria-label="Next">&#8250;</button>' +
      '<figure class="lightbox__figure"><img alt=""><figcaption class="lightbox__cap"></figcaption></figure>';
    document.body.appendChild(lb);
    lb.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    lb.querySelector(".lightbox__nav--prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector(".lightbox__nav--next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    return lb;
  }

  function step(n) { lbIdx = (lbIdx + n + lbList.length) % lbList.length; paintLightbox(); }

  function paintLightbox() {
    var p = lbList[lbIdx];
    var img = lb.querySelector("img");
    img.src = p.src;
    img.alt = p.caption;
    lb.querySelector(".lightbox__cap").innerHTML =
      esc(p.caption) + '<span>' + fmtDate(p.date) + (p.location ? ' &middot; ' + esc(p.location) : '') + '</span>';
  }

  function openLightbox(list, i) {
    ensureLightbox();
    lbList = list; lbIdx = i;
    paintLightbox();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------------- tagalog ---------------- */

  function allTagalog() {
    var seen = {}, out = [];
    LETTERS.slice().reverse().forEach(function (l) {
      (l.tagalog || []).forEach(function (w) {
        var k = w.word.toLowerCase();
        if (!seen[k]) { seen[k] = 1; out.push({ word: w.word, meaning: w.meaning, date: l.date }); }
      });
    });
    return out.reverse();
  }

  /* ---------------- expose ---------------- */

  window.MW = {
    M: M, LETTERS: LETTERS, PHOTOS: PHOTOS,
    d: d, today: today, days: days, fmtDate: fmtDate, esc: esc, plural: plural,
    status: status, excerpt: excerpt, letterCard: letterCard, letterMeta: letterMeta,
    letterBodyHtml: letterBodyHtml, photosFor: photosFor, renderPhotoGrid: renderPhotoGrid,
    openLightbox: openLightbox, allTagalog: allTagalog
  };

  document.addEventListener("DOMContentLoaded", renderChrome);
})();
