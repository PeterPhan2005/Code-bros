# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes rather than layering workarounds.
- Do not mix UI, realtime, AI, execution, and persistence concerns.
- Respect `architecture-context.md`.
- Prefer reliable increments over speculative abstractions.
- Do not invent behavior missing from the context files.

## TypeScript

- Strict mode required.
- Avoid `any`.
- Use interfaces for object contracts.
- Use discriminated unions for statuses and event payloads.
- Validate external input before use.

## Validation

Use Zod for API bodies, task payloads, OpenAI structured output, realtime messages, execution events, patch definitions, snapshots, and invitation payloads.

## Next.js

- Default to React Server Components.
- Use client components only for Monaco, Liveblocks, WebContainers, and browser interaction.
- Keep route handlers thin.
- Authenticate and authorize before mutations.
- Put durable AI work in Trigger.dev.
- Never import server secrets or Prisma into client components.

## Components

- Components render UI and handle interaction.
- Business logic belongs in hooks, domain modules, or server helpers.
- Do not access Prisma or OpenAI directly from components.
- Do not place execution policy inside generic terminal components.
- Do not modify generated `components/ui/*` files unless explicitly required.

## Styling

- Use semantic CSS variables and Tailwind tokens.
- Avoid raw palettes and hardcoded colors.
- Follow the radius scale.
- Use Lucide React.
- Preserve visible focus and reduced-motion support.

## API Routes

Every mutation route must:

1. Parse and validate input.
2. Authenticate the user.
3. Load the project.
4. Verify role.
5. Perform one focused action.
6. Return a predictable response.

Use `401`, `403`, `404`, `409`, `422`, and `429` appropriately.

## Authorization

- Never trust client-supplied user IDs, owner IDs, or roles.
- Room access derives from project membership.
- Viewers cannot edit, execute, invoke AI, or review patches.
- Editors cannot manage ownership or invitations.
- Only Owners delete projects or change roles.

## Data and Storage

PostgreSQL stores metadata and relationships. Vercel Blob stores large snapshots, archives, diffs, and logs.

Use transactions for patch decisions, patch metadata application, role changes, invitation acceptance, and snapshot pointer changes when atomicity matters.

## Realtime

- Validate realtime payloads.
- Keep human chat, AI status, execution output, and activity in distinct typed channels.
- Presence remains lightweight.
- Do not keep durable history only in transient realtime state.
- Exclude the current user from remote cursors and selections.
- Use deterministic participant colors.

## Collaborative Files

- Hide provider details behind project hooks/services.
- Use stable file IDs where practical.
- Keep one consistent local/remote edit flow.
- Do not overwrite active collaborative state with older snapshots.
- Load a snapshot only when the room is empty or uninitialized.

## File Safety

- Enforce 1 MB per file and 10 MB per snapshot.
- Reject unsupported binaries and executables.
- Normalize paths and prevent traversal.
- Prevent duplicate canonical paths.
- Protect secret files from AI.
- AI file deletion requires additional confirmation.

## Protected Files

At minimum protect `.env`, `.env.*`, private keys, certificates, credential files, cloud secrets, and deployment token files.

Never log, send, patch, or expose protected contents.

## OpenAI

- Call OpenAI only from server-side or Trigger.dev workflows.
- Send minimum relevant context.
- Filter protected files before context construction.
- Validate model output.
- Treat model output as untrusted.
- Never apply generated edits without validation and approval.
- Add cancellation, timeout, rate limits, and run ownership.

## AI Patches

- Persistent first-class records.
- Generation and application are separate.
- Every patch references a base version.
- Reject stale patches.
- Apply atomically.
- Snapshot before and after application.
- Preserve rejected and stale history.
- Revert creates a new event rather than deleting history.
- First valid accept/reject decision wins.

## Trigger.dev

- Validate task payloads.
- Publish meaningful progress.
- Handle retries safely and idempotently.
- Avoid duplicate patch creation.
- Clear AI state on success, failure, and cancellation.
- Verify run ownership before token issuance.

## WebContainers

- Temporary execution environment only.
- Owners and Editors may run code.
- Execution host owns stdin.
- Others receive read-only output.
- Handle host disconnection explicitly.
- Enforce command allowlists and AI command approval.
- Never expose server credentials or mount protected server files.

## Snapshots

- Debounce autosave.
- Save durable snapshots periodically.
- Save before and after accepted AI patches.
- Do not write on every keystroke.
- Prevent stale clients from overwriting newer versions.
- Store metadata in Prisma and contents in Blob.

## File Organization

- `app/` — pages and routes
- `components/editor/` — workspace UI
- `components/ai/` — AI and patch UI
- `components/execution/` — terminal, tests, preview
- `hooks/` — browser and realtime coordination
- `lib/` — infrastructure and domain helpers
- `trigger/` — durable workflows
- `types/` — shared contracts
- `prisma/` — schema and migrations
- `data/templates/` — starter projects

## Verification

Before completing a feature:

- TypeScript passes
- lint passes
- production build passes
- permissions are tested
- realtime is tested with two sessions
- protected-file behavior is checked
- errors/disconnection are visible
- context and progress files are updated
