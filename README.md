# I Have 2 Much Tabs

## WARNING

## THIS IS A VIBE-CODED APPLICATION.
## EXPECT ROUGH EDGES, INCOMPLETE FLOWS, AND OCCASIONAL BREAKING CHANGES.
## USE IT AS A PERSONAL EXPERIMENTAL TOOL.

## What this extension does

`I Have 2 Much Tabs` is a Chrome extension that helps you reduce open-tab chaos while keeping searchable knowledge.

It can:

- scan currently open tabs,
- extract page text and links,
- generate summaries/tags/topics/technologies with Azure OpenAI,
- let you ask semantic questions about previously analyzed tabs,
- export knowledge to `JSONL` and LLM-friendly `TXT`,
- show token usage/cost estimates in dashboard,
- close analyzed tabs when you decide.

## Installation (Local)

### 1. Clone repository

```bash
git clone <YOUR_REPO_URL>
cd ihave2muchtabs/extension
```

### 2. Install dependencies

```bash
npm install
```

### 3. Typecheck and build

```bash
npm run typecheck
npm run build
```

### 4. Load extension in Chrome

1. Open: `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select folder: `.../ihave2muchtabs/extension`

### 5. Configure Azure OpenAI

Open extension `Options` and set:

- `Azure OpenAI Endpoint` (base URL only, e.g. `https://<resource>.openai.azure.com`)
- `API Key`
- `Chat Deployment Name`
- `Embeddings Deployment Name`
- `API Version`

## How to use

1. Open your tabs in Chrome.
2. Open extension popup.
3. Choose scan scope (`All Open Tabs` / `Current Window Tabs`).
4. Click `Start Scan`.
5. Open `Dashboard` to monitor progress, logs, summaries, and costs.
6. Ask questions in popup (`Ask`).
7. Export results (`JSONL` / `TXT`) when needed.

## Data storage

Data is stored locally in Chrome extension storage / IndexedDB.
This project currently uses a fresh knowledge DB schema (no migration from older schemas).

## Notes

- Cost panel in dashboard is an estimate, not exact Azure billing.
- For major updates, clear/rebuild local DB if schema behavior changes.

