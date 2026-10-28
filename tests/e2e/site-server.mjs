/**
 * Sirve el sitio construido por Eleventy y permite cortar la red a voluntad,
 * para probar la precarga offline en un Chromium real.
 *
 *   puerto SITE_PORT (3201)      el sitio estático
 *   puerto SITE_PORT + 1         control: GET /down  deja de escuchar (conexiones rechazadas,
 *                                         como un corte de red real)
 *                                         GET /up    vuelve a escuchar
 *                                         GET /bump  simula un despliegue nuevo: /sw.js sale con
 *                                                    otro identificador de build
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.SITE_PORT) || 3201;

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-talks-site-'));
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`falló: ${cmd} ${args.join(' ')}`); process.exit(1); }
};
run(process.execPath, ['scripts/sync-fonts.mjs']);
run('npx', ['eleventy', `--output=${out}`, '--quiet']);

const cleanup = () => { fs.rmSync(out, { recursive: true, force: true }); };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(0); });

function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  let file = path.join(out, decoded);
  if (path.relative(out, file).startsWith('..')) return { status: 404 };
  if (decoded.endsWith('/')) file = path.join(file, 'index.html');
  else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) return { redirect: decoded + '/' };
  return fs.existsSync(file) && fs.statSync(file).isFile() ? { file } : { status: 404 };
}

let bumps = 0;
/** /sw.js con el build id alterado si se ha "desplegado" una versión nueva. */
function serviceWorkerSource(file) {
  const text = fs.readFileSync(file, 'utf8');
  return bumps ? text.replace(/buildId: "([^"]*)"/, (_, id) => `buildId: "${id}-v${bumps}"`) : text;
}

let site = null;
function up() {
  if (site) return;
  site = Bun.serve({
    port: PORT,
    fetch(req) {
      const { pathname } = new URL(req.url);
      const r = resolveFile(pathname);
      if (r.redirect) return new Response(null, { status: 301, headers: { Location: r.redirect } });
      if (!r.file) return new Response('not found', { status: 404 });
      if (pathname === '/sw.js') {
        return new Response(serviceWorkerSource(r.file), { headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' } });
      }
      return new Response(Bun.file(r.file));
    },
  });
}
function down() {
  site?.stop(true);
  site = null;
}
up();

Bun.serve({
  port: PORT + 1,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === '/down') down();
    else if (pathname === '/up') up();
    else if (pathname === '/bump') bumps++;
    return new Response(site ? 'up' : 'down', { headers: { 'Access-Control-Allow-Origin': '*' } });
  },
});
console.log(`site on :${PORT}, control on :${PORT + 1}`);
