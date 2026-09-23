// Precomputes embeddings for every example question.
// Usage (from the repo root):
//   npm install @huggingface/transformers@4.3.0
//   node tools/build.mjs
// Reads tools/knowledge.src.json, writes knowledge.json.
// The page still works without this step (it embeds the questions in the
// browser on first load); this just makes the first answer faster.

import { pipeline } from '@huggingface/transformers';
import { readFile, writeFile } from 'node:fs/promises';

const MODEL = 'Xenova/all-MiniLM-L6-v2'; // must match index.html
const SRC = new URL('./knowledge.src.json', import.meta.url);
const OUT = new URL('../knowledge.json', import.meta.url);

const kb = JSON.parse(await readFile(SRC, 'utf8'));
const extractor = await pipeline('feature-extraction', MODEL, { dtype: 'q8' }); // q8 = same weights as the browser

for (const topic of kb.topics) {
  if (!topic.answer || topic.answer === 'TODO') {
    console.warn(`⚠︎ ${topic.id}: answer missing`);
  }
  const out = await extractor(topic.questions, { pooling: 'mean', normalize: true });
  topic.embeddings = out.tolist().map(v => v.map(x => Math.round(x * 1e4) / 1e4));
}

kb.meta.model = MODEL;
kb.meta.built = new Date().toISOString();
await writeFile(OUT, JSON.stringify(kb));

const n = kb.topics.reduce((s, t) => s + t.questions.length, 0);
console.log(`✓ ${kb.topics.length} topics, ${n} questions → knowledge.json`);
