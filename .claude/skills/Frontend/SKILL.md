# Frontend Development Rules

This frontend is optional and exists only to demonstrate that the backend API works correctly.

## Goals

- Keep the UI extremely simple.
- Prioritize functionality over design.
- Avoid spending excessive time on frontend implementation.
- The frontend should showcase API behavior clearly.

## Tech Stack

- React
- Vite
- Fetch API
- Plain CSS or minimal styling

## UI Requirements

Create a single-page application that contains:

- Category filter dropdown
- Product list
- Load More button
- Loading state
- Error state

No additional pages are required.

## Design Rules

- Keep the interface clean and minimal.
- Avoid complex component hierarchies.
- Avoid unnecessary animations.
- Avoid UI libraries unless absolutely necessary.
- Focus on usability.

## API Integration Rules

- Use the backend products endpoint.
- Support category filtering.
- Support cursor-based pagination.
- Store and send nextCursor correctly.
- Append new products instead of replacing existing products when loading more.

## State Management Rules

- Use React useState and useEffect.
- Do not use Redux, Zustand, MobX, Context API, or other state management libraries.
- Keep state local and simple.

## Component Rules

Prefer a small structure such as:

- App
- ProductList
- ProductCard

Avoid unnecessary abstraction.

## Performance Rules

- Render only the data received.
- Avoid premature optimization.
- Keep components lightweight.

## Code Quality Rules

- Prioritize readability.
- Keep components small.
- Use clear naming.
- Make changes easy during a live interview.

## Interview Readiness

- Every component should be explainable quickly.
- Avoid advanced React patterns.
- Prefer straightforward implementation.
- Focus on demonstrating backend functionality.