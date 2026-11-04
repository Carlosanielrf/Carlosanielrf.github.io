# Carlos Fonseca — CV chat page

A personal CV with a chat built in. Visitors can read it or ask questions and get answers I wrote myself. A small sentence-embedding model (all-MiniLM-L6-v2, via Transformers.js) runs in the visitor's browser and matches each question to the right answer. No LLM, no backend, nothing leaves the browser.

Live at https://carlosanielrf.github.io

## Files

```
index.html               page, styles and chat logic
knowledge.json           what the page loads (optionally with embeddings)
photo.jpg                avatar (480×480)
cv.pdf                   downloadable CV
tools/knowledge.src.json the file to edit: topics, questions, answers, links
tools/build.mjs          checks the knowledge base, precomputes embeddings → knowledge.json
```

## Editing answers

1. Edit `tools/knowledge.src.json`.
2. Check it with `node tools/build.mjs --check` (no download needed). It flags broken `related` ids and lists topics still marked TODO.
3. Either copy it over `knowledge.json` (the browser embeds the questions on first load), or precompute embeddings:
   ```
   npm install --no-save @huggingface/transformers@4.3.0
   node tools/build.mjs
   ```
4. Commit and push.

Topic fields: `id`, `questions`, `answer`, plus optional `chip` (label when offered as a follow-up question), `related` (topic ids suggested after this answer), `keywords`, `links` and `groups`. A topic with no `chip` is still answerable but never suggested. An answer of `"TODO"` hides the topic until it's filled in. Answers can use `{iosYears}` and `{boschYears}`, computed from `meta.dates`, so they never go stale.

Other `meta` fields: `suggest` (chips after a fallback), `notEnglish` (reply to questions that look Portuguese) and `goatcounter` (optional GoatCounter code; page views only, questions are never sent).

## Page structure

The page is a regular CV (experience, own apps, skills, education and languages, contact) written as static HTML, so it reads well without typing anything and search engines can index it. The chat sits beside it: docked on the right on wide screens, and on phones a compose bar at the bottom opens it as a sheet. "Ask …" buttons in the CV send a question straight to the chat.

The CV sections and the chat answers repeat the same facts. When a fact changes, update both `index.html` and `tools/knowledge.src.json`.

## Tuning

Every question logs the matched topic and score in the browser console (`match location 0.712`). Wrong answers → raise `meta.threshold` or add phrasings. Too many "I don't know" → lower it or add phrasings.

A topic's optional `keywords` (e.g. `"skill"`, `"hobby"`, singular or plural) add +0.15 to its score when they appear in the question, so a bare "skills" or "hobbies" goes straight there, while a clearly better match elsewhere ("frontend skills" → web-dev) still wins.

## Running locally

```
python3 -m http.server 8000   # then open http://localhost:8000
```
Opening `index.html` as a file blocks the model and `knowledge.json`.
