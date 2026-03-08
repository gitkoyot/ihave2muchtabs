# Sample Open Tabs Set (Manual QA)

Open 10-20 public tabs in Chrome before running QA.

## Recommended mix

- 4-6 backend/docs pages (Spring, auth, APIs, architecture)
- 2-3 tooling pages (Docker, CI/CD, databases)
- 2 unrelated pages (frontend/mobile/devops crossover)
- 1 likely blocked page (login-required or restricted)

## Why this mix matters

- Validates strong topical matches.
- Validates related URL suggestions.
- Validates weak/noise handling.
- Validates `failed` / `restricted` outcomes.

## Notes

- Use only `http/https` pages (other schemes are skipped by scanner).
- Keep at least 3-5 thematically related pages for meaningful semantic retrieval tests.
