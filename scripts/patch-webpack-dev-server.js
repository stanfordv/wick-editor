/**
 * webpack-dev-server 3 loads `spdy` at startup. `spdy` loads `http-deceiver`,
 * which calls process.binding('http_parser'). That internal was removed in
 * Node 21+, so `npm start` crashes before the dev server listens.
 *
 * This server only uses spdy on Node < 10. Drop the top-level require so a
 * normal HTTP dev server can start on current Node.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  'webpack-dev-server',
  'lib',
  'Server.js'
);

if (!fs.existsSync(file)) {
  console.warn('webpack-dev-server not installed; skipping dev-server patch');
  process.exit(0);
}

const needle = "const spdy = require('spdy');\n";
const usage = 'this.listeningApp = spdy.createServer(options.https, app);';
let src = fs.readFileSync(file, 'utf8');

if (!src.includes(needle)) {
  process.exit(0);
}

if (!src.includes(usage)) {
  console.warn('webpack-dev-server spdy usage changed; dev-server patch was not applied');
  process.exit(0);
}

src = src.replace(needle, '');
src = src.replace(
  usage,
  "this.listeningApp = require('spdy').createServer(options.https, app);"
);

fs.writeFileSync(file, src);
console.log('Patched webpack-dev-server to load spdy only on Node < 10');
