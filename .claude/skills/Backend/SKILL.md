# Backend Development Rules

This project is a backend-focused engineering assignment. The primary goals are correctness, performance, simplicity, and explainability.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- pg package
- dotenv

## Architecture Rules

- Prefer simple and readable code.
- Avoid overengineering.
- Do not use TypeScript.
- Do not use Prisma or any ORM.
- Use raw SQL with the pg package.
- Prefer functions over classes.
- Keep files small and focused.
- Every file should be understandable within a few minutes.

## Database Rules

- PostgreSQL is the source of truth.
- Use parameterized SQL queries.
- Never build SQL using string concatenation.
- Prefer database-level optimization over application-level optimization.
- Use proper indexes when queries depend on sorting or filtering.
- Explain index choices with concise comments.

## Pagination Rules

- Never use OFFSET pagination.
- Use cursor-based pagination.
- Order products by:
  - updated_at DESC
  - id DESC
- Cursor must contain:
  - updated_at
  - id
- Cursor should be encoded as base64 JSON.
- Pagination must:
  - avoid duplicates
  - avoid missing records
  - remain stable during inserts and updates
- Always use id as a deterministic tie-breaker.

## API Rules

- Keep APIs RESTful and predictable.
- Validate all incoming query parameters.
- Return consistent JSON responses.
- Use proper HTTP status codes.
- Return clear error messages.
- Never expose raw database errors.

## Performance Rules

- Assume the dataset contains 200,000+ rows.
- Avoid full table scans when possible.
- Fetch only required data.
- Use LIMIT correctly.
- Think about index usage before writing queries.
- Write code that can be explained during an interview.

## Seeding Rules

- Generate large datasets efficiently.
- Never insert rows one-by-one.
- Use batch inserts.
- Log batch progress.
- Keep seed logic simple and reproducible.

## Code Quality Rules

- Optimize for interview readability.
- Avoid unnecessary abstractions.
- Avoid design patterns unless clearly needed.
- Write code that can be modified live during an interview.
- Prefer explicit logic over clever solutions.

## Documentation Rules

- Add comments only where they improve understanding.
- Explain cursor pagination.
- Explain important SQL queries.
- Explain indexing decisions.