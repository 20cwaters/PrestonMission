/* ============================================================
   Shared site engine: header/footer, date math, letters, photos.
   Loaded on every page after the data files.
   ============================================================ */

(function () {
  "use strict";

  var M = window.MISSION;
  // Every entry in letters.js, including "From the family" posts (kind: "family").
  // LETTERS is the missionary's own letters only: counts, "latest letter",
  // week numbers and spiritual thoughts all come from those.
  var ENTRIES = (window.LETTERS || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  var LETTERS = ENTRIES.filter(function (l) { return l.kind !== "family"; });
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
    { href: "mission.html", label: "The Mission" },
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
            '<span>Made by ' + esc("Casey Waters") + ' &middot; <a href="' + esc(inquiryHref()) + '">Want one for your missionary?</a></span>' +
            '<span>Last updated ' + fmtDate(LETTERS.length ? LETTERS[0].date : M.dates.mtcStart, "short") + '</span>' +
          '</div>' +
        '</div>';
    }
  }

  // "Want one for your missionary?" An email to Casey Waters, already filled in.
  // It goes to a +hello address that Mission Control leaves in the inbox.
  function inquiryHref() {
    var body = "Hi Casey,\r\n\r\nI saw the mission website for " + M.missionary.fullName +
      " and I'd love one for my missionary.\r\n\r\nMissionary's name:\r\nMission:\r\n" +
      "Left (or leaving) on:\r\nBest way to reach me:\r\n\r\nThanks!";
    return "mailto:" + "caseymissionsites+hello@gmail.com" +
      "?subject=" + encodeURIComponent("A mission website for my missionary") +
      "&body=" + encodeURIComponent(body);
  }

  /* ---------------- letters ---------------- */

  function excerpt(letter, n) {
    var first = "";
    for (var i = 0; i < letter.body.length; i++) {
      if (letter.body[i].type === "p" || (letter.kind === "family" && letter.body[i].text)) { first = letter.body[i].text; break; }
    }
    n = n || 190;
    return first.length > n ? first.slice(0, n).replace(/\s+\S*$/, "") + "…" : first;
  }

  function letterMeta(l) {
    if (l.kind === "family") {
      return '<div class="letter-card__meta">' +
        '<span class="pill pill--family">From the family</span>' +
        '<span>' + fmtDate(l.date) + '</span>' +
        '</div>';
    }
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
      if (b.type === "family") return familyBlockHtml(b);
      if (b.type === "scripture") {
        return '<blockquote class="scripture">' +
          b.text.split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
          (b.ref ? '<cite>' + esc(b.ref) + '</cite>' : '') +
          '</blockquote>';
      }
      return '<p>' + esc(b.text) + '</p>';
    }).join("");
  }

  /* ---------------- from the family ---------------- */

  // Anything a relative shares is always labelled, so it can never be
  // mistaken for the missionary's own words.
  function sharedByLabel(s) {
    var first = String((s && s.name) || "").trim().split(/\s+/)[0] || "Family";
    return "Shared by " + first + (s && s.relationship ? ", " + s.relationship : "");
  }

  function familyBlockHtml(b) {
    return '<aside class="family-note">' +
      '<p class="family-note__label">From the family &middot; ' + esc(sharedByLabel(b)) + '</p>' +
      String(b.text || "").split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
      '</aside>';
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
      (p.sharedBy ? '<span class="photo__shared">' + esc(sharedByLabel(p.sharedBy)) + '</span>' : '') +
      (p.video ? '<span class="photo__play" aria-label="Video"></span>' : '') +
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
      '<figure class="lightbox__figure"><img alt=""><div class="lightbox__video" hidden></div><figcaption class="lightbox__cap"></figcaption></figure>';
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
    var img = lb.querySelector("img"), video = lb.querySelector(".lightbox__video");
    // Videos play in Cloudflare Stream's player. Its iframe is removed when another
    // photo shows or the lightbox closes, which is what stops the sound.
    video.innerHTML = p.video && /^https:\/\/[a-z0-9.-]+\.cloudflarestream\.com\//.test(p.embed || "")
      ? '<iframe src="' + esc(p.embed) + '?autoplay=true" title="' + esc(p.caption || "Video") + '" ' +
        'allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen></iframe>'
      : "";
    video.hidden = !video.innerHTML;
    img.hidden = !video.hidden;
    if (video.hidden) img.src = p.src;
    img.alt = p.caption;
    lb.querySelector(".lightbox__cap").innerHTML =
      esc(p.caption) + '<span>' + fmtDate(p.date) + (p.location ? ' &middot; ' + esc(p.location) : '') + '</span>' +
      (p.sharedBy ? '<span class="lightbox__shared">' + esc(sharedByLabel(p.sharedBy)) + '</span>' : '');
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
    lb.querySelector(".lightbox__video").innerHTML = "";
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

  /* ---------------- after the mission ---------------- */

  // Once the release date has passed, the site reads as a finished mission: past tense,
  // "came home", no countdown, and no "write him" (the missionary email is closed).
  // It runs after each page's own script and rewrites only the bits that would be wrong,
  // so the pages themselves don't change. (Added by Mission Control's template update.)
  function finishedMission() {
    if (!M.dates || !M.dates.release || today() < d(M.dates.release)) return;
    var she = M.missionary.title === "Sister";
    var he = she ? "she" : "he", He = she ? "She" : "He";
    var name = M.missionary.firstName, missionName = M.mission.name;
    var home = fmtDate(M.dates.release), total = days(d(M.dates.mtcStart), d(M.dates.release));
    var fieldAreas = (M.areas || []).filter(function (a) { return a.type !== "mtc"; });
    var $ = function (sel) { return document.querySelector(sel); };
    var setText = function (sel, text) { var el = $(sel); if (el) el.textContent = text; };

    // Navigation, footer and tab title: "Where He Served", "About", nothing to write to.
    [].forEach.call(document.querySelectorAll('a[href="map.html"], a[href="about.html"]'), function (a) {
      a.textContent = a.textContent.replace(/Where (He|She) Is/, "Where $1 Served").replace(/About & Write (Him|Her)/, "About");
    });
    document.title = document.title.replace(/Where (He|She) Is/, "Where $1 Served").replace(/About & Write (Him|Her)/, "About");
    [].forEach.call(document.querySelectorAll('[data-site-footer] a[href="about.html#write"], [data-site-footer] a[href^="mailto:' + M.missionary.email + '"]'), function (a) {
      var box = a.closest("li, p");
      if (box) box.parentNode.removeChild(box);
    });

    // Home: the hero facts and the progress card.
    var facts = document.querySelectorAll("[data-hero-facts] .fact");
    if (facts.length) {
      ["Served in the " + missionName, "Spoke " + M.mission.language, "Home since " + home].forEach(function (t, i) {
        if (facts[i] && facts[i].lastElementChild) facts[i].lastElementChild.innerHTML = "<b>" + esc(t) + "</b>";
      });
      for (var i = 3; i < facts.length; i++) facts[i].parentNode.removeChild(facts[i]);
    }
    var stats = $("[data-stats]");
    if (stats) {
      stats.innerHTML = [[total, "Days served"], [LETTERS.length, "Letters home"], [fieldAreas.length || "—", "Areas served"]].map(function (s) {
        return '<div class="stat"><div class="stat__num">' + esc(s[0]) + '</div><div class="stat__label">' + esc(s[1]) + '</div></div>';
      }).join("");
    }

    // About: past tense, "Came home", no current area or companion, no "How to write him".
    var write = document.getElementById("write");
    if (write) {
      write.hidden = true;
      var mtc = (M.areas[0] && M.areas[0].type === "mtc") ? M.areas[0].name : "MTC";
      setText("[data-lede]", name + " served in the " + missionName + ", speaking " + M.mission.language + ". " + He +
        " entered the " + mtc + " on " + fmtDate(M.dates.mtcStart) + " and came home " + home + ".");
      [].forEach.call(document.querySelectorAll("[data-facts] .card"), function (card) {
        var label = card.firstElementChild, key = label ? label.textContent.trim().toLowerCase() : "";
        if (key === "expected home") label.textContent = "Came home";
        if (key === "currently" || key === "companion") card.parentNode.removeChild(card);
      });
    }

    // The Mission page: who led it, and how long it was.
    if ($("[data-mission-title]")) {
      var months = Math.round(total / 30.44);
      var length = Math.abs(months - 24) <= 1 ? "two years" : Math.abs(months - 18) <= 1 ? "eighteen months" : months + " months";
      setText("[data-lede]", name + " served here for " + length + ". Here is where the mission is, who led it while " + he +
        " was there, and what a missionary's life there looks like.");
      setText("[data-length]", length.charAt(0).toUpperCase() + length.slice(1) + " — " + total +
        " days from the MTC to the plane home. " + He + " finished on " + home + ".");
      [].forEach.call(document.querySelectorAll(".eyebrow"), function (p) {
        if (/who leads the mission/i.test(p.textContent)) p.textContent = "Who led the mission";
      });
    }

    // Where He Served: no "now", and the last area instead of the current one.
    var current = $("[data-current]");
    if (current) {
      var h1 = $("h1");
      if (h1) h1.textContent = "Where " + he + " served";
      setText("[data-intro]", fieldAreas.length
        ? He + " served in " + fieldAreas.length + " area" + (fieldAreas.length === 1 ? "" : "s") + ". Use the buttons above to jump between them, and drop into street view to see what each one actually looks like."
        : "The areas " + he + " served in get added here as " + (she ? "her" : "his") + " letters are added. Drop into street view to look around.");
      if (current.previousElementSibling) current.previousElementSibling.textContent = "Last area";
      var a = status().area;
      if (!a || a.type === "mtc") {
        current.innerHTML = '<p class="muted">' + (she ? "Her" : "His") + " areas in " + esc(M.mission.country) + " get added here as " + (she ? "her" : "his") + " letters are added.</p>";
      } else {
        current.innerHTML = '<h3 style="font-size:1.5rem">' + esc(a.name) + '</h3>' +
          '<p class="muted" style="margin-bottom:1.2em">' + esc(a.region) + '</p>' +
          '<p style="font-size:.95rem"><strong>Arrived:</strong> ' + fmtDate(a.start) + '<br>' +
          (a.companion ? '<strong>Companion:</strong> ' + esc(a.companion) + '<br>' : '') +
          '<strong>Until ' + he + ' came home:</strong> ' + home + '</p>' +
          (a.note ? '<p style="color:var(--ink-soft);font-size:.95rem">' + esc(a.note) + '</p>' : '');
      }
      [].forEach.call(document.querySelectorAll(".area-tab__now"), function (el) { el.parentNode.removeChild(el); });
    }
  }
  // After every page's own DOMContentLoaded script (they're registered after this file loads).
  document.addEventListener("DOMContentLoaded", function () { setTimeout(finishedMission, 0); });

  /* ---------------- expose ---------------- */

  window.MW = {
    M: M, LETTERS: LETTERS, ENTRIES: ENTRIES, PHOTOS: PHOTOS,
    d: d, today: today, days: days, fmtDate: fmtDate, esc: esc, plural: plural,
    status: status, excerpt: excerpt, letterCard: letterCard, letterMeta: letterMeta,
    letterBodyHtml: letterBodyHtml, photosFor: photosFor, renderPhotoGrid: renderPhotoGrid,
    openLightbox: openLightbox, allTagalog: allTagalog, sharedByLabel: sharedByLabel
  };

  document.addEventListener("DOMContentLoaded", renderChrome);
})();
