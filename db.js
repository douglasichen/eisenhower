// Every mutation of db.json is committed + pushed. That's the whole point of this file.
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const FILE = path.join(__dirname, 'db.json');

const git = (args) =>
  new Promise((res) =>
    execFile('git', args, { cwd: __dirname }, (e, out, err) =>
      res({ ok: !e, out: (out || '') + (err || '') || (e ? e.message : '') })
    )
  );

const ops = {
  read: () => JSON.parse(fs.readFileSync(FILE, 'utf8')),
  write: (data) => {
    // write-then-rename: a reader mid-write sees the old file, never a truncated one
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(data, null, 2) + '\n');
    fs.renameSync(FILE + '.tmp', FILE);
  },
};

// one write+commit at a time, so each commit holds exactly the change its message names
// and two quick clicks can't collide over .git/index.lock
let queue = Promise.resolve();
function commit(data, msg) {
  queue = queue
    .then(async () => {
      ops.write(data);
      const add = await git(['add', '--', 'db.json']);
      if (!add.ok) return console.error('git add failed:', add.out);

      const made = await git(['commit', '-m', msg, '--', 'db.json']);
      if (!made.ok) {
        if (!/nothing to commit/.test(made.out)) console.error('git commit failed:', made.out);
        return;
      }
      const pushed = await git(['push', '-q']);
      if (!pushed.ok) console.error('git push failed:', pushed.out);
    })
    .catch((e) => console.error('git:', e.message));
  return queue;
}

// ponytail: proxy so any future mutating op auto-pushes without remembering to call commit()
module.exports = new Proxy(ops, {
  get: (t, k) => (k === 'write' ? (data, msg) => commit(data, msg || 'update db') : t[k]),
});
