# eisenhower

Assignment tracker: a due-date × importance scatter plot and a searchable list, in one HTML page
backed by one JSON file. Every change to the data is committed and pushed, so `git log db.json`
is the full history of what was due, done, or dropped.

```sh
node server.js   # http://localhost:47913
```

## Files

- `db.json` — the database: `{ courses: [...], assignments: [{ id, name, course, due, importance, status }] }`.
  `status` is `open` | `done` | `skip` (not doing), `importance` is 1–3.
- `db.js` — read/write. Writes are queued one at a time, written atomically, then committed and
  pushed. Only `db.json` goes into those commits.
- `index.html` — the whole UI. Colour scheme lives in the `:root` custom properties at the top.
- `server.js` — serves the page and `db.json` on localhost, accepts `POST /db`.

## The plot

- x is the due date, y is importance; the axis runs 0–4 so points can spread without clipping.
- Points sharing a day and an importance fan out around the line; a lone point sits exactly on it.
- The number box is zoom: `show N days at once` sets how much time fills the viewport. Drag the
  plot to move through the timeline.
- The timeline starts today, reaching into the past only when something still shown is overdue.
- Hovering a point explains it; clicking does nothing — the table is where things change.

Topics take their colour and marker shape from their position in `db.json`'s `courses` array —
reorder it to recolour.
