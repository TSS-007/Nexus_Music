# Collaboration chat checks

Run `supabase/collaboration-chat-setup.sql` once in the Supabase SQL Editor after the existing collaboration setup. This creates the message table, RPCs and private `collaboration-files` bucket. No public bucket or Realtime publication is needed; open conversations poll every five seconds.

Messages support text (4,000 characters), one attachment (1 byte–50 MiB), or both. Files download as attachments rather than being rendered as HTML. Files are available only to the two participants of an accepted collaboration. Sender identity, file ownership and size are validated by the database. Repeated sends with the same message ID are idempotent. Failed sends retain the draft for retry. Older history is available with “Load older messages.”

## Automated database test

Install `@electric-sql/pglite` in a temporary directory and run:

```bash
PGLITE_MODULE=/absolute/path/to/node_modules/@electric-sql/pglite/dist/index.js node tests/chat-permissions.mjs
```

The test uses local PostgreSQL with a minimal mock of Supabase's auth and storage schemas. It checks migration repeatability, participant isolation, idempotency, pending/anonymous denial, forged sender/path denial, and protection of published attachments. Supabase's HTTP upload limits require a live-project check.

## Live-project verification

1. Open an accepted collaboration from account A. Send text, a file alone, and text with a file.
2. Open the same collaboration as B. Confirm updates appear within five seconds, download the file, and compare it with the original. Refresh both sessions.
3. Verify C cannot read messages or download files, including by directly requesting a known storage path. Pending/declined requests must not allow sending.
4. Verify empty messages and zero-byte/over-50-MiB files are rejected. Disconnect the network during a send, reconnect, and retry: only one message should be saved.
5. Check older-message loading, mobile layout and long filenames. Hover “Explore highlights”: no full-width purple rectangle should appear; keyboard focus must remain visible.

The local production build used placeholder Supabase environment values. Apply the SQL and run these live-project checks before merging/deploying. Next.js 16.4.0 also emitted an existing security-upgrade advisory during validation; address it before public launch.
