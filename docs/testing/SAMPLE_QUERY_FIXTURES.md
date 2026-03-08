# Sample Query Fixtures

Use these questions after analyzing a mixed set of tabs.

## Targeted queries

- `Did I have any open tab about Spring Boot authentication?`
- `Do I have tabs related to OAuth2 in Spring Security?`
- `Show me tabs about JWT authentication setup.`
- `Which tabs discuss Java dependency injection patterns?`

## Broader recall queries

- `What did I save about backend authorization?`
- `Do I have anything about API security architecture?`
- `Which tabs look relevant to secure login flows?`

## Comparative queries

- `Besides the main Spring auth docs, what related pages did I capture?`
- `Which analyzed tabs are similar but not directly about authentication?`

## Control queries

- `Did I save anything about Kubernetes operators?` (when dataset does not contain it)
- `Do I have tabs about SwiftUI animations?` (backend-focused dataset)

## Expected output behavior

- Answers stay grounded in retrieved records.
- Output shape includes:
  - `answer`
  - `matched_urls`
  - `related_urls`
  - `confidence`
- When evidence is weak, answer should explicitly state uncertainty.
