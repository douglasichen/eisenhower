# eisenhower

Assignment tracker: due date × importance scatter, one HTML page, one JSON file.

```sh
node server.js   # http://localhost:47913
```

- `db.json` — the database.
- `db.js` — read/write. Every write is committed and pushed to `main` automatically, so `git log db.json` is the full history.
- `index.html` — the page (plot + list + add form). Colour scheme lives in the `:root` vars at the top.
- `server.js` — serves the page, takes `POST /db`.

Topics get a colour + shape from their position in `db.json`'s `courses` array (topics) — reorder it to recolour.
