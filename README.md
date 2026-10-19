# T7 Defense IQ Prep — ISSB IQ Preparation Tool

## Run locally
1. Extract this ZIP into a folder.
2. Open the `iq-prep` folder in VS Code.
3. Open `index.html` in a browser or use VS Code Live Server.
4. Keep `index.html`, `style.css`, `script.js`, `questions.js`, and `current-affairs.js` in the same folder.

## IQ question bank
- `questions.js` is the offline question bank. The dashboard count is calculated from the loaded `QUESTIONS` array (5,140 questions in this ZIP).
- Daily Current Affairs questions are deliberately **not** added to `QUESTIONS`; they live in `current-affairs.json` and are shown in their own Online section. The 20 existing evergreen information-literacy questions that were labelled Current Affairs are retained offline under General Knowledge, so the 5,140-question total is preserved.
- Existing offline IQ practice and local AI/model files are not changed by Current Affairs.

## Current Affairs: daily automatic updates
The Current Affairs page is online-only. The GitHub Actions workflow at `.github/workflows/daily-current-affairs.yml` runs daily at 08:00 Bangladesh time (02:00 UTC) and can also be run manually.

To enable it:
1. Upload/push the contents of this folder to a GitHub repository that hosts your site.
2. In the repository, open **Settings → Secrets and variables → Actions → New repository secret**.
3. Add a secret named `OPENAI_API_KEY` with your own OpenAI API key. Do not put the key in frontend JavaScript or commit it into the repository.
4. In **Settings → Actions → General**, allow workflows to read and write repository contents (the workflow needs to commit the generated JSON).
5. In **Actions**, run **Daily Current Affairs Update** once manually and check the logs.
6. Make sure your static hosting deploys the committed `current-affairs.json` changes. If using GitHub Pages with a build/deploy workflow, configure that deployment to publish the updated JSON too.

The workflow reads public RSS metadata/snippets from publishers and asks the model to draft an MCQ, then performs a second model-based check. This reduces risk but is not a guarantee of accuracy; each question links to its source when available. Feed availability and snippets vary.

## 72-hour expiry
Every generated question stores `createdAt` and `expiresAt` (72 hours later). The UI hides expired items and the daily update script removes expired questions from `current-affairs.json` on the next successful run. The online file is cleaned at the next daily run, so a question can remain in the JSON for up to roughly 24 hours after its expiry, but it will already be hidden in the UI after 72 hours. This cleanup only touches Current Affairs data, not `questions.js`.

## Add IQ questions manually
Open `questions.js`, find `const QUESTIONS = [`, and add unique question objects before the final `];`. Each question should use the existing schema (`id`, `subject`, `question`, four `options`, zero-based `answer`, and `explanation`). The dashboard count updates from the array length.

## Important
- Opening the page via `file://` may block `fetch()` for `current-affairs.json`; use a local web server (such as VS Code Live Server) or deploy the site to hosting.
- Current Affairs requires an internet connection. If unavailable, the offline IQ question bank still works.
- Do not expose API keys in public files.
- This is an independent practice tool, not an official recruitment portal.
