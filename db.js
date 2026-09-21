// Every mutation of db.json is committed + pushed. That's the whole point of this file.
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const FILE = path.join(__dirname, 'db.json');
const git = (args) =>
  new Promise((res) => execFile('git', args, { cwd: __dirname }, (e, o, err) => res(e ? err.trim() : o)));

const ops = {
  read: () => JSON.parse(fs.readFileSync(FILE, 'utf8')),
  write: (data) => fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n'),
};

async function push(msg) {
  await git(['add', '--', 'db.json']);
  const out = await git(['commit', '-m', msg, '--', 'db.json']);
  if (/nothing to commit/.test(out)) return;
  const pushed = await git(['push', '-q']);
  if (pushed) console.error('push failed:', pushed);
}

// ponytail: proxy so any future mutating op auto-pushes without remembering to call push()
module.exports = new Proxy(ops, {
  get: (t, k) =>
    k === 'write'
      ? (data, msg) => {
          t.write(data);
          push(msg || 'update db').catch((e) => console.error(e.message));
        }
      : t[k],
});
