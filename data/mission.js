/* ============================================================
   MISSION CONFIG  —  edit this file to update the facts.
   Anything marked TODO is a guess or a blank you should fill in.
   ============================================================ */

window.MISSION = {

  missionary: {
    firstName: "Preston",
    lastName: "Waters",
    title: "Elder",
    get fullName() { return this.title + " " + this.firstName + " " + this.lastName; },
    email: "preston.waters@missionary.org",
    portrait: "photos/preston.jpg",          // drop his mission photo here
    tagline: "Serving the people of northern Luzon, one 'kamusta po' at a time.",
    homeWard: "",                            // TODO: e.g. "Cedar Hills 5th Ward"
    farewellDate: ""                         // TODO: optional, YYYY-MM-DD
  },

  mission: {
    name: "Philippines Tuguegarao Mission",
    shortName: "Tuguegarao",
    country: "Philippines",
    language: "Tagalog",
    languageNative: "Tagalog / Filipino",
    presidentName: "",                       // TODO: "President & Sister ____"
    officeAddress: [                         // TODO: confirm from the mission office
      "Philippines Tuguegarao Mission",
      "Tuguegarao City, Cagayan",
      "Philippines"
    ],
    mapCenter: [17.6132, 121.7270],          // Tuguegarao City
    mapZoom: 7,
    // Rough outline of the mission (northern Luzon: Cagayan Valley, Isabela,
    // Nueva Vizcaya, Batanes, Ilocos & the Cordilleras). Decorative only.
    boundsHint: [[18.9, 120.4], [16.0, 122.4]]
  },

  dates: {
    mtcStart: "2026-08-05",                  // entered the Provo MTC
    manilaMtcStart: "2026-09-04",            // approximate — he said "earlier this week" in a letter dated 2026-09-04, no exact day given
    fieldStart: null,                        // TODO: first day in the actual mission field
    release: "2028-08-05",                   // expected release / homecoming
    transferLength: 6                        // weeks per transfer
  },

  links: {
    // The shared album he links in every email
    googlePhotos: "https://photos.app.goo.gl/f1DwQm3z7ssG8TBcA"
  },

  /* ------------------------------------------------------------
     GOOGLE MAPS
     Paste your Maps JavaScript API key below and the map page turns
     on. See "Setting up the map" in README.md for how to get one.
     Until a key is here, the page shows a friendly notice instead of
     a broken map. The key is visible in the page source — that is
     normal for Google Maps — so restrict it by website in the Google
     Cloud console once the site is deployed.
     ------------------------------------------------------------ */
  maps: {
    apiKey: "AIzaSyAFgOVCbW4-VKrasthQZ4g2PvMfPcQm0J4",           // <-- paste the key between the quotes
    defaultZoom: 17,      // how close the map starts. 15 = neighbourhood, 18 = rooftops
    mapType: "hybrid"     // "hybrid" = satellite with street names, "satellite" = imagery only
  },

  /* ------------------------------------------------------------
     AREAS — add a new entry every time he gets transferred.
     Set `current: true` on exactly one, and give the previous one
     an `end` date. Look up lat/lng by searching the town on
     Google Maps and copying the two numbers from the URL.
     ------------------------------------------------------------ */
  areas: [
    {
      name: "Provo MTC",
      region: "Provo, Utah, USA",
      type: "mtc",
      start: "2026-08-05",
      end: "2026-09-04",
      lat: 40.259166,
      lng: -111.645602,
      zoom: 17,                              // optional: overrides maps.defaultZoom for this area
      companion: "Elder Ferguson",
      note: "Six weeks of Tagalog, teaching practice, and cafeteria food that 'actually slaps.'",
      current: false
    },
    {
      name: "Manila MTC",
      region: "Quezon City, Metro Manila",
      type: "mtc",
      start: "2026-09-04",
      end: null,
      lat: 14.5822,
      lng: 121.0525,
      companion: "",
      note: "The MTC was full, so his group is staying at a hotel and taking classes at a nearby church building instead.",
      current: true
    }
  ]
};
