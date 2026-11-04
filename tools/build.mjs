// Checks the knowledge base and precomputes embeddings for every example question.
// Usage (from the repo root):
//   npm install --no-save @huggingface/transformers@4.3.0
//   node tools/build.mjs            checks + embeddings → knowledge.json
//   node tools/build.mjs --check    checks only, no model download
// Reads tools/knowledge.src.json, writes knowledge.json.
// The page still works without embeddings (it embeds the questions in the
// browser on first load); they just make the first answer faster.

import { readFile, writeFile } from 'node:fs/promises';

const MODEL = 'Xenova/all-MiniLM-L6-v2'; // must match index.html
const SRC = new URL('./knowledge.src.json', import.meta.url);
const OUT = new URL('../knowledge.json', import.meta.url);
const checkOnly = process.argv.includes('--check');

const kb = JSON.parse(await readFile(SRC, 'utf8'));

// ---------- Checks ----------
const all = new Map(kb.topics.map(t => [t.id, t]));
const live = new Set(kb.topics.filter(t => t.answer && t.answer !== 'TODO').map(t => t.id));
let problems = 0;
const warn = msg => { problems++; console.warn(`⚠︎ ${msg}`); };

if (all.size !== kb.topics.length) warn('duplicate topic ids');
const suggestable = (from, id) => {
  const t = all.get(id);
  if (!t) warn(`${from}: "${id}" doesn't exist`);
  else if (!t.chip) warn(`${from}: "${id}" has no "chip" label, so it can't be offered as a follow-up`);
};
for (const t of kb.topics) {
  if (!t.questions?.length) warn(`${t.id}: no example questions`);
  for (const r of t.related || []) suggestable(`${t.id}.related`, r);
  for (const m of (t.answer || '').matchAll(/\{(\w+)\}/g)) {
    if (!kb.meta.dates?.[m[1]]) warn(`${t.id}: {${m[1]}} has no entry in meta.dates`);
  }
}
for (const s of kb.meta.suggest || []) {
  suggestable('meta.suggest', s);
  if (all.has(s) && !live.has(s)) warn(`meta.suggest: "${s}" is still TODO`);
}
const todo = kb.topics.filter(t => !live.has(t.id)).map(t => t.id);
if (todo.length) console.log(`… hidden until answered (TODO): ${todo.join(', ')}`);

if (checkOnly) {
  console.log(problems ? `✗ ${problems} problem(s)` : '✓ knowledge base looks good');
  process.exit(problems ? 1 : 0);
}

// ---------- Embeddings ----------
const { pipeline } = await import('@huggingface/transformers');
const extractor = await pipeline('feature-extraction', MODEL, { dtype: 'q8' }); // q8 = same weights as the browser

for (const topic of kb.topics) {
  if (!live.has(topic.id)) continue; // the page drops TODO topics, no need to embed them
  const out = await extractor(topic.questions, { pooling: 'mean', normalize: true });
  topic.embeddings = out.tolist().map(v => v.map(x => Math.round(x * 1e4) / 1e4));
}

kb.meta.model = MODEL;
kb.meta.built = new Date().toISOString();
await writeFile(OUT, JSON.stringify(kb));

const n = kb.topics.reduce((s, t) => s + (live.has(t.id) ? t.questions.length : 0), 0);
console.log(`✓ ${live.size} topics, ${n} questions → knowledge.json`);
