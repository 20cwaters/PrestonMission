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

## 2. Fetch new email

Search Gmail: `from:preston.waters@missionary.org newer_than:30d`

For each thread newer than the most recent letter on the site, fetch it with
`get_thread` using `messageFormat: "PLAIN_TEXT"`.

Skip anything whose subject + date already matches an existing letter. Process oldest first if
several are new.

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

The Gmail connector cannot read attachment bytes, so the images have to come from somewhere else.
Check both sources, local first:

**Source A — the local inbox (preferred).** Look in `photos/_inbox/`.
- If there is a `.zip` (Gmail's "Download all attachments"), unzip it in place.
- Collect every `.jpg` / `.jpeg` / `.png` / `.heic` in the folder, ignoring `README.txt` and the
  `_filed/` subfolder.

**Source B — Google Drive.** If the local inbox is empty, look for a Drive folder named
`Preston Mission Photos`:
```
mimeType = 'application/vnd.google-apps.folder' and title = 'Preston Mission Photos'
```
Then list images inside it that were added since the previous letter's date:
```
parentId = '<folderId>' and mimeType contains 'image/' and createdTime > '<previous letter date>T00:00:00Z'
```
Download each with `download_file_content` (returns base64) and decode it to bytes.

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

**If neither source has anything**, leave the placeholders. The site renders a labelled tile
naming the file it's waiting for, so nothing looks broken. List the needed filenames in the report.

## 7. Check your work

- `node --check data/letters.js`, `node --check data/photos.js`, `node --check data/mission.js` —
  all three must parse. If any fails, restore that file from `data/.backup/` and report the failure.
- Confirm the new letter id is unique and that every id in the letter's `photos` array has a
  matching entry in `photos.js`.

## 8. Report

Write a short summary covering:
- Which letter was added (title and date), or that there was no new email
- Any Tagalog words added
- **Any change made to `mission.js`, stated plainly** — new companion, new area, dates set
- Anything you were unsure about and deliberately left alone, so Casey can decide
- Which photo files still need saving, if any

Keep it to a few lines. If nothing needed attention, say so in one sentence.
