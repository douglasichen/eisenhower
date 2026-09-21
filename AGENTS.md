# Working on this repo as an agent

A single-page assignment tracker: `index.html` (plot + table), `db.json` (the data),
`server.js` (serves both, accepts writes), `db.js` (writes + auto-commit). No dependencies,
no build step, no framework. Node stdlib only — keep it that way.

```sh
node server.js   # http://localhost:47913, localhost-only by design
```

## The data contract

```jsonc
{
  "courses": ["COMR 457", "CPSC 418", "..."],   // order decides each topic's colour AND marker shape
  "assignments": [
    {
      "id": "a1",                 // unique, any string
      "name": "quiz 3",
      "course": "COMR 457",       // must appear in `courses` (the UI appends it if missing)
      "due": "2026-09-22",        // yyyy-mm-dd, local calendar date
      "importance": 1,            // 1, 2 or 3 — the plot's axis runs 0–4 only for spacing
      "status": "open"            // "open" | "done" | "skip" (skip = not doing)
    }
  ]
}
```

`courses` is positional: reordering it recolours the plot. Appending is safe, inserting is not.

## Changing the data

**Write through the server, not the file.** Every accepted POST writes `db.json` atomically,
commits it alone, and pushes to `main` — that history is the point of the project. Editing
`db.json` directly bypasses all of it.

`POST /db` takes the **entire** database plus a commit message. Read the current state first,
mutate, send it back:

```js
const http = require('http');
const db = JSON.parse(require('fs').readFileSync('db.json', 'utf8'));

db.assignments.push({
  id: Math.random().toString(36).slice(2, 9),
  name: 'essay 3', course: 'PHIL 250', due: '2026-11-30', importance: 2, status: 'open',
});

const req = http.request({ port: 47913, path: '/db', method: 'POST' }, (r) => r.resume());
req.end(JSON.stringify({ data: db, msg: 'add essay 3 (PHIL 250)' }));
```

The response is `ok` as soon as the write is queued; the commit and push happen a moment later.
`400` means the payload wasn't `{courses: [], assignments: []}`-shaped. Git failures are logged
to the server's stdout, never to the client — check that terminal if a commit seems missing.

If the server isn't running, edit `db.json` and commit it yourself; don't leave it uncommitted.

## Exploring without polluting history

Inside the page, `db`, `render()`, `save()`, `visible()` and `view` are globals. To try
something, mutate `db` and call `render()` — **not** `save()`, which writes and pushes. Reload
to discard. This is the right way to test rendering edge cases (odd names, unknown topics,
overdue items) without touching the database.

To check the data is intact:

```sh
node -e 'const d=require("./db.json");
const ids=new Set(d.assignments.map(a=>a.id));
console.log({n:d.assignments.length, dupIds:ids.size!==d.assignments.length,
  badDue:d.assignments.filter(a=>!/^\d{4}-\d{2}-\d{2}$/.test(a.due)).length,
  badImp:d.assignments.filter(a=>![1,2,3].includes(a.importance)).length,
  ghostTopics:d.assignments.filter(a=>!d.courses.includes(a.course)).map(a=>a.course)});'
```

## Things that will bite you

- **Dates are calendar dates, not durations.** Use `addDays()` / `parse()`; never
  `new Date(t + n * 86400000)` for anything the user sees. An hour of DST drift silently shifts
  a label to the previous day.
- **All user text goes through `esc()`** before landing in `innerHTML` — names, topics, and
  anything interpolated into an attribute. Assignment names are arbitrary strings.
- **Every `save()` re-renders the whole list**, destroying the row being edited. That's why
  `save()` takes a `refocus` argument; keep it working if you touch inline editing.
- **The plot is read-only.** Clicks do nothing on purpose; hovering shows the tooltip. State
  changes belong in the table.
- **`localStorage` holds view preferences only** (the zoom). Anything that belongs to the data
  goes in `db.json`.
- **`db.js`'s queue is load-bearing.** Two writes landing together used to race over
  `.git/index.lock` and drop a commit. Keep writes serialized through it.
- The server binds `127.0.0.1` and serves an allowlist of three paths. It hands out a writable
  database that auto-pushes to a public repo — don't widen either.

## House style

Smallest change that works. Prefer a platform feature over code, and code over a dependency.
Mark a deliberate shortcut with a `ponytail:` comment naming its ceiling.
