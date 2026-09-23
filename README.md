# Carlos Fonseca — CV chat page

A personal CV presented as a chat. Visitors ask questions and get answers I wrote myself. A small sentence-embedding model (all-MiniLM-L6-v2, via Transformers.js) runs in the visitor's browser and matches each question to the right answer. No LLM, no backend, nothing leaves the browser.

Live at https://carlosanielrf.github.io

## Files

```
index.html               page, styles and chat logic
knowledge.json           what the page loads (optionally with embeddings)
photo.jpg                avatar (480×480)
cv.pdf                   downloadable CV
tools/knowledge.src.json the file to edit: topics, questions, answers, links
tools/build.mjs          precomputes embeddings → knowledge.json
```

## Editing answers

1. Edit `tools/knowledge.src.json`.
2. Either copy it over `knowledge.json` (the browser embeds the questions on first load), or precompute embeddings:
   ```
   npm install --no-save @huggingface/transformers@4.3.0
   node tools/build.mjs
   ```
3. Commit and push.

## Tuning

Every question logs the matched topic and score in the browser console (`match location 0.712`). Wrong answers → raise `meta.threshold` or add phrasings. Too many "I don't know" → lower it or add phrasings.

A topic's optional `keywords` (e.g. `"skill"`, `"hobby"`, singular or plural) add +0.15 to its score when they appear in the question, so a bare "skills" or "hobbies" goes straight there, while a clearly better match elsewhere ("frontend skills" → web-dev) still wins.

## Running locally

```
python3 -m http.server 8000   # then open http://localhost:8000
```
Opening `index.html` as a file blocks the model and `knowledge.json`.
