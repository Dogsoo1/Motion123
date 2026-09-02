/**
 * Produce a single self-contained HTML file.
 *
 * The dev server loads the game as separate ES modules, which is convenient
 * locally and useless anywhere else. This inlines the stylesheet and bundles
 * every module into one script so the whole game is one file you can host,
 * email, or wrap in a native shell.
 *
 *   npm run bundle
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'dist-single/deal-room.html');

const result = await build({
  entryPoints: [resolve(ROOT, 'src/ui/main.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  write: false,
  legalComments: 'none',
});

const script = result.outputFiles[0].text;
const css = readFileSync(resolve(ROOT, 'web/styles.css'), 'utf8');

// No doctype/html/head/body: the artifact host supplies that skeleton, and a
// browser opening the file directly infers it.
const html = `<title>Deal Room</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
${css}
</style>

<div id="app"></div>

<script type="module">
${script}
</script>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, 'utf8');

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Wrote ${OUT} (${kb} KB)`);
