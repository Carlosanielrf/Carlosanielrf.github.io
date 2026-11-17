// Generates the two CV variants (HTML + PDF) from cv/template.html.
// Usage: node cv/build.mjs   (needs Google Chrome on macOS for the PDF step)
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tpl = readFileSync(join(dir, 'template.html'), 'utf8');

for (const role of ['Developer', 'Engineer']) {
  const html = tpl.replaceAll('{{ROLE}}', role).replaceAll('{{role}}', role.toLowerCase());
  const file = join(dir, `ios-${role.toLowerCase()}.html`);
  writeFileSync(file, html);
  execFileSync(chrome, ['--headless', '--no-pdf-header-footer', `--print-to-pdf=${join(dir, `iOS ${role}.pdf`)}`, `file://${file}`], { stdio: 'ignore' });
  console.log('built', role);
}
