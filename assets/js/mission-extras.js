/* ============================================================
   MISSION EXTRAS  —  Mission Control writes this file and replaces it
   whenever its template changes, so change the data, not this:
     · About page: the mission president, from mission.president
       in data/mission.js
     · Where page: the mission boundary picture, from data/boundary.js
       (uploaded in Mission Control, on the site's page)
   Each section stays hidden until there is something to show.
   ============================================================ */
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function monthYear(d) {
    var t = new Date(d + "T12:00:00");
    return isNaN(t) ? "" : t.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var M = window.MISSION || {}, mission = M.mission || {};
    var missionName = mission.name || "mission";
    var who = (M.missionary || {}).firstName || "the missionary";

    /* ---------------- the mission president (About page) ---------------- */
    var ps = document.querySelector("[data-president]");
    var p = mission.president;
    if (ps && p && p.names && p.bio && p.bio.length) {
      var body = ps.querySelector("[data-president-body]");
      body.innerHTML =
        (p.photo ? '<div class="president__photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.names) + '"></div>' : '') +
        '<div class="president__text">' +
          '<h3>' + esc(p.names) + '</h3>' +
          (p.since ? '<p class="president__since">Leading the ' + esc(missionName) + ' since ' + esc(monthYear(p.since)) + '</p>' : '') +
          [].concat(p.bio).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join("") +
          (p.source && p.source.url
            ? '<p class="president__source">From their introduction in <a href="' + esc(p.source.url) +
              '" target="_blank" rel="noopener">' + esc(p.source.label || "Church News") + '</a>.</p>'
            : '') +
        '</div>';
      if (!p.photo) body.classList.add("president--nophoto");
      ps.hidden = false;
    }

    /* ---------------- the mission boundary (Where page) ---------------- */
    var bs = document.querySelector("[data-boundary]");
    var b = window.MISSION_BOUNDARY;
    if (bs && b && b.image) {
      var img = bs.querySelector("[data-boundary-img]");
      img.onload = function () { bs.hidden = false; };   // a missing file just leaves the section hidden
      img.alt = "Map of the " + missionName + "'s boundary";
      img.src = b.image;
      bs.querySelector("[data-boundary-link]").href = b.image;
      bs.querySelector("[data-boundary-intro]").textContent =
        "The outlined area is the " + missionName + ". Every area " + who + " serves in will be somewhere inside it.";
      bs.querySelector("[data-boundary-caption]").textContent =
        (b.caption || "From the Church's map of the mission.") + " Tap to see it full size.";
    }
  });
})();
