# Backend Configuration Notes

This document tracks the backend data contracts and flows that changed while fixing the expert–farmer chat regressions.

## Data Collections

- `users`: unchanged (stores roles, profile & rating aggregates).
- `conversations`: chat sessions between farmers and experts. Status pipeline is `pending → answered → completed`. Once both parties delete a conversation the document may be removed, but key metadata is now captured before removal.
- `messages`: individual chat payloads.
- `expertReviews` **(new)**: immutable snapshot for every completed conversation that received a rating. Schema:
  - `conversationId`: reference to the original conversation (unique).
  - `expertId`, `farmerId`: participants.
  - `rating`, `comment`, `completedAt`.
  - Automatic timestamps for auditing.

## Review Retention Flow

1. When a farmer completes a conversation (submits rating/comment) the backend upserts a matching document in `expertReviews`.
2. If a legacy conversation is deleted before a snapshot existed, the delete handler now forces the same upsert before purging chat history.
3. Read APIs (`GET /experts`, `GET /experts/:id`) load review counts and lists from `expertReviews` after ensuring a one-time backfill for the requested experts. This guarantees comments remain visible even if the chat history is cleared.

## Conversation Status Rules

- Farmer message ➜ status becomes `pending` so the thread moves to “Chưa trả lời” for both participants until the expert replies again.
- Expert reply while status `pending` ➜ status switches to `answered`.
- Completed chats (`completed` status) remain read-only; farmers must request reopen before sending new messages.

## Impacted Endpoints

- `POST /conversations/:conversationId/messages`: updates status buckets according to sender to keep both tabs accurate.
- `POST /conversations/:conversationId/complete`: persists expert review snapshots.
- `DELETE /conversations/:conversationId`: keeps reviews intact before hard delete.
- `GET /experts`, `GET /experts/:id`: read review data from the new snapshot collection so UI never loses farmer comments when experts purge history.
