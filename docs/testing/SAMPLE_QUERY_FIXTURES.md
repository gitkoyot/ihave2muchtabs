# Sample Query Fixtures (MVP)

Use these questions after analyzing a small set of open tabs (10-20 URLs) including at least some developer documentation.

## Topic-Specific Queries

- `Did I have any open tab about Spring Boot authentication?`
- `Do I have tabs related to OAuth2 in Spring?`
- `Did I keep any tab about JWT authentication?`
- `Show me tabs about Java dependency injection.`

## Broader Technical Recall Queries

- `Did I have anything open about Spring Security?`
- `What tabs do I have about API authorization?`
- `Do I have docs related to backend security configuration?`

## Comparative/Discovery Queries

- `Besides the main Spring auth page, what related tabs do I have?`
- `Which previously open tabs look related to Spring Boot security even if they are not exactly authentication docs?`

## Negative/Control Queries

- `Did I have anything open about Kubernetes operators?` (when no such tabs were analyzed)
- `Do I have bookmarks about SwiftUI animations?` (when dataset is backend-focused)

Expected behavior:

- The answer should remain grounded in retrieved records only.
- If no strong matches exist, answer should explicitly say evidence is weak/absent.
