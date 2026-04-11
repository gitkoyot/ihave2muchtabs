# Repository Guidelines

## Project Structure & Module Organization
This repository is centered on the browser extension in `extension/`. Core runtime code lives under `extension/src/` and is split by responsibility: `background/` for orchestration, `popup/`, `dashboard/`, `options/`, `llm/`, `storage/`, `tabs/`, and supporting utilities in `utils/`. Tests live in `extension/test/` and use focused `*.test.ts` files such as `tabScanner.test.ts` and `validators.test.ts`. Product and QA documentation is in `docs/`, while packaged release ZIPs are emitted at the repository root.

## Build, Test, and Development Commands
Run all development commands from `extension/`.

- `npm install`: install local dependencies.
- `npm run typecheck`: run strict TypeScript checks with no output files.
- `npm run test`: execute the Vitest suite in Node.
- `npm run build`: build the Chrome extension bundle.
- `npm run build:firefox`: build the Firefox variant.
- `npm run watch`: rebuild Chrome artifacts on change during development.

After a successful build, load `extension/` as an unpacked extension in the browser.

## Coding Style & Naming Conventions
The codebase uses TypeScript with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` enabled. Follow the existing style: 2-space indentation in JSON/config, semicolons in TypeScript, and double quotes in most source files. Use `camelCase` for variables and functions, `PascalCase` for types, and keep filenames descriptive and lower camel or domain-based, for example `service-worker.ts` or `contentExtractor.ts`. There is no dedicated lint script yet, so match surrounding code closely and keep modules small and single-purpose.

## Testing Guidelines
Vitest is configured in `extension/test/vitest.config.ts` and includes `**/*.test.ts`. Add unit tests beside the existing suites in `extension/test/` whenever logic changes in scanning, extraction, storage, retrieval, or validators. Prefer deterministic tests with explicit fixtures and run `npm run test` plus `npm run typecheck` before opening a PR.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Update MD file` and `Add connection check, fix Ollama CORS 403, improve result visibility`. Keep commits narrowly scoped and describe the user-visible change first. Pull requests should include a short summary, testing performed, any config or provider impact, and screenshots for popup, dashboard, or options UI changes.

## Security & Configuration Tips
Do not commit API keys or local provider secrets. Treat `chrome.storage.local` settings and exported knowledge files as user data, and document any change that affects external model providers, permissions, or persistence.
