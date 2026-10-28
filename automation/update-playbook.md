# Playbook: turn Preston's weekly email into site updates

This is the source of truth for the weekly automation. The scheduled task reads this file and
follows it. You can also run it by hand any time — just say "run the mission site update playbook."

Project root: `C:\Users\Casey Waters\Documents\PrestonMission`

---

## 0. Guardrails — read these first

- **Never invent a fact.** Companion names, area names, dates, and place names go in *only* if
  Preston actually states them. If something is implied but not certain, leave the field alone and
  raise it in the final report instead. A wrong companion name on the site is worse than a blank one.
- **Preserve his voice exactly.** Copy his sentences verbatim into `body` — typos, slang, "thaf",
  "gas", "low key", missing apostrophes and all. Do not correct, tighten, or rewrite his prose.
  The only edits allowed are joining hard-wrapped lines back into paragraphs and trimming the
  quote marks around pasted scripture.
- **Never delete or rewrite existing entries.** This job only adds new ones, plus the specific
  `mission.js` field changes described in step 5.
- **Back up before editing.** Copy `data/letters.js`, `data/photos.js` and `data/mission.js` into
  `data/.backup/` (timestamped) before the first write of a run.
- **If there is no new email, do nothing** and report that. Do not re-process an email that is
  already on the site.

---

## 1. Find out what the site already has

Read `data/letters.js` and collect every existing `id` and `date`. Read `data/mission.js` for
`dates.mtcStart`, the `areas` list, and which area currently has `current: true`.

## 2. Read the new email

Mission Control checks Gmail and saves each new email from the missionary before starting this
run. **Do not search Gmail yourself.** The prompt names the file:

- `automation/incoming/<date>-<gmail id>.md` — the subject, the send time in UTC *and* already
  converted to the local date, the list of attachments, and the plain-text body
- `automation/incoming/<date>-<gmail id>.eml` — the raw message, only if you need it
- Its image attachments are already in `photos/_inbox/` (zips already unpacked)

If the email's subject and date already match a letter on the site, change nothing and report
`RESULT: no-new-email`.

## 3. Pull the letter apart

From the plain text body, produce:

| Field | How |
|---|---|
| `title` | The email subject, as sent |
| `date` | The date he sent it, in **local time**, `YYYY-MM-DD`. Gmail timestamps are UTC — an email stamped `2026-08-19T04:26Z` was sent the evening of `2026-08-18` Mountain time. Subtract accordingly. |
| `week` | `floor(days between mission.dates.mtcStart and this date / 7) + 1` |
| `location` | The area he was in when he wrote it (see step 5 — if he announces a move mid-letter, the letter belongs to the area he was writing *from*) |
| `body` | Array of blocks. Normal paragraphs are `{ type: "p", text: "..." }`. Quoted scripture is `{ type: "scripture", ref: "...", text: "..." }` |
| `albumUrl` | The `photos.app.goo.gl` link in the email; if absent, reuse `mission.js` → `links.googlePhotos` |

**Scripture blocks.** When he pastes verses, put them in one `scripture` block (multiple verses
separated by a blank line inside the same block, not several blocks). Strip the wrapping quote
marks; keep the verse numbers. Normalize the reference to its proper name — he misspells them,
e.g. "Doctorine and Covenants 11:12-13" becomes `Doctrine and Covenants 11:12–13` (en dash).

**Spiritual thought.** Most weeks he signals it ("I wanna finish off this email with...", "a
scripture that stood out to me", or a testimony paragraph). Fill `spiritualThought` with:
- `title` — a short phrase you write, drawn from his own words (e.g. "Put your trust in that Spirit")
- `intro` — his lead-in sentence, if he has one
- `scriptureRef` — the reference, if there is one
- `scripture` — the verses, or if the thought is a testimony rather than a quote, that paragraph

If a week genuinely has no spiritual content, set the fields to empty strings. Don't manufacture one.

**Tagalog.** Collect every word or phrase he explains, however he phrases it — inline
parentheses (`ding ding (wall)`), a dash (`bababa ba - will it go down`), or a whole sentence
about a word. Capitalize the term, keep his own gloss for the meaning. Skip words that appear
without an explanation.

**Photo captions.** The lines after the album link are captions, one per attached photo, in
order. Each becomes a photo with id `YYYY-MM-DD-N` and src `photos/YYYY-MM-DD-N.jpg`.

## 4. Write the letter and photo entries

Insert the new letter object immediately after `window.LETTERS = [` in `data/letters.js`, and the
photo objects immediately after `window.PHOTOS = [` in `data/photos.js`. Match the formatting of
the entries already in those files.

## 5. Detect and apply life changes — this is the important part

Read the email for these, and update `data/mission.js` when he states them:

**A new companion.** Look for "my new companion", "my comp is", "I'm training", "my new
trainer/trainee", or a companion introduced by name. Set `companion` on the current area entry.
If he names a companion for the first time for an area that has an empty `companion`, fill it in.

**A transfer or new area.** Look for "I got transferred", "I'm in ___ now", "my new area",
"moved to", "opening an area", "whitewash". When it happens:
1. On the area that currently has `current: true`, set its `end` to the date of the move (or the
   letter date if he doesn't say) and `current: false`.
2. Add a new entry at the end of `areas` with `current: true`, `type: "area"`, his stated area
   name, the province/region, and `start`.
3. Look up the town's coordinates with a web search and fill `lat` / `lng`. Sanity-check them —
   they must fall inside northern Luzon, roughly latitude 16 to 19 and longitude 120 to 122.5.
   If you cannot confirm the location, set both to `null` and flag it in the report rather than
   guessing.

**Leaving the Provo MTC / arriving at the Manila MTC.** Set `dates.manilaMtcStart`, close out the
Provo MTC area, and add the Manila MTC as an area (lat `14.5822`, lng `121.0525`).

**Arriving in the actual mission field.** Set `dates.fieldStart` to that date. This is what
switches the site from "Week N at the MTC" to the six-week transfer counter, so it matters.

**Other facts worth capturing** when he mentions them: the mission president's name
(`mission.presidentName`), the mission office address (`mission.officeAddress`), or his ward.

## 6. Photos

Mission Control saves the email's image attachments into `photos/_inbox/` before this run starts
(prefixed with the send date), and Casey can drop extra pictures there from the dashboard.

**The inbox.** Look in `photos/_inbox/`.
- If there is a `.zip`, unzip it in place.
- Collect every `.jpg` / `.jpeg` / `.png` / `.heic` in the folder, ignoring `README.txt` and the
  `_filed/` subfolder.

### Matching photos to captions

Do **not** assume file order matches caption order — Casey may save them in any order.

Instead, **look at each image** (read the image file) and match it to the caption that describes
it. His captions are concrete and visual — "Getting destroyed in Catan", "Rain", "My district at
the Temple", "Me and Elder Mellor" — so a board game photo, a rain photo, and a group shot in
front of a temple are each unmistakable. Assign by content, not by filename.

If a photo genuinely doesn't match any caption, or two captions fit equally well, fall back to
file order for the ambiguous ones and say so in the report.

### Filing them

Write each to `photos/YYYY-MM-DD-N.jpg`, where `N` is the position of its caption in the letter
(caption 1 → `-1.jpg`). Convert HEIC or PNG to JPG if needed.

- **Never overwrite an existing photo file.** If the target name is taken, skip it and report.
- After filing from the local inbox, move the originals into `photos/_inbox/_filed/` so next
  week starts clean. Move, never delete.
- If the number of images doesn't match the number of captions, file the ones you're confident
  about and report the mismatch.

### Then optimize them — do not skip this

Photos off a phone are 3–8 MB each, far too heavy for the live site and for the repo. After
filing, always run:

```
npm run optimize
```

This resizes every photo to a web-sized version plus a thumbnail, bakes in EXIF rotation so
nothing shows up sideways, and strips metadata (including GPS coordinates, which is worth
having off a public site). It keeps untouched originals in `photos/_inbox/_filed/`, is safe to
re-run, and skips anything already done. Typical saving is about 90%.

Report the before/after totals it prints. If it fails, say so and do not commit the giant
originals — a few unoptimized megabytes in git are permanent.

**If the inbox is empty**, leave the placeholders. The site renders a labelled tile
naming the file it's waiting for, so nothing looks broken. List the needed filenames in the report.

## 7. Check your work

- `node --check data/letters.js`, `node --check data/photos.js`, `node --check data/mission.js` —
  all three must parse. If any fails, restore that file from `data/.backup/` and report the failure.
- Confirm the new letter id is unique and that every id in the letter's `photos` array has a
  matching entry in `photos.js`.

## 8. Publish

The site is a git repo wired to Netlify: **anything pushed to `main` deploys automatically**
within a minute or two. Nothing else is needed to make the update go live.

Only publish if step 7 passed. Then:

```
git add -A
git commit -m "Add letter: <title> (<date>)"
git push origin main
```

Write the commit body as a short list of what actually changed — the letter, the photos filed,
and any `data/mission.js` change (new companion, transfer, dates set). End the message with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

Notes:
- Credentials are cached by Git Credential Manager, so the push should not prompt. If it does
  fail on authentication, **stop, leave the commit in place**, and say so in the report — Casey
  can push it by hand. Never try to work around auth.
- If `git push` is rejected because the remote moved ahead, run `git pull --rebase origin main`
  and push again. If that conflicts, stop and report rather than forcing anything.
- Never use `git push --force`.
- Photos are committed alongside the data files, so the whole update lands in one deploy.

## 9. Report

Mission Control reads this report, so end your run with it in exactly this shape:

```
## Report
RESULT: added | no-new-email | failed
LETTER: <title> (<date>)        — or: none

- Tagalog/language words added: ...
- mission.js changes: ...      (state every change plainly, or "none")
- Photos: which were filed and how they were matched; optimizer before/after
- Photos still needed: ...      (or "none")
- Push: succeeded / failed (and why)

### Left alone
- <each thing you saw but deliberately did not change, so Casey can decide>
- (write "- None" if there was nothing)
```

Anything listed under **Left alone** flags the run for Casey's review in the dashboard, so put
every ambiguous fact there — and only there. Leave entries with `type: "family"`, `kind: "family"`
or a `sharedBy` alone: those were added by family through Mission Control.
