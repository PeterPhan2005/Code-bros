# Architecture Context

## Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Framework | Next.js 16 + React 19 + TypeScript | Full-stack application and server/client boundaries |
| UI | Tailwind CSS v4 + shadcn/ui | Workspace composition and reusable primitives |
| Editor | Monaco Editor | Multi-file code editing |
| Auth | Clerk | Identity and authenticated access |
| Database | PostgreSQL + Prisma | Projects, rooms, members, invitations, patches, tasks, activity, and metadata |
| Realtime | Liveblocks | Presence, room events, chat, AI status, and shared coordination |
| Collaborative text | Abstracted CRDT document layer | Shared file contents, cursors, and selections |
| Execution | WebContainers | Browser-hosted Node.js execution, terminal, tests, and preview |
| AI | OpenAI | Explanation, debugging, retrieval, patch generation, and agent workflows |
| Background tasks | Trigger.dev | Durable AI runs, retries, status, and patch generation |
| Artifact storage | Vercel Blob | Project snapshots, exports, patch artifacts, and logs |

## Product Hierarchy

```text
Project
└── Room
    ├── Files
    ├── Members
    ├── Chat Feed
    ├── AI Status
    ├── Execution Session
    ├── Patches
    └── Activity
```

Each project has one default room in the MVP. Room access derives from project membership.

## System Boundaries

### `app/`

Pages, layouts, and authenticated route handlers. Routes validate input, enforce roles, trigger tasks, and persist metadata. Long-running AI work does not run here.

### `components/`

UI composition only: file explorer, Monaco workspace, presence, chat, patch review, terminal, preview, and activity.

### `lib/`

Shared infrastructure and domain helpers: Prisma, access checks, protected-file matching, snapshot helpers, patch validation, context retrieval, WebContainer coordination, and storage.

### `trigger/`

Durable AI workflows: context retrieval, patch generation, test planning, retries, progress, and failure handling.

### `types/`

Shared contracts for roles, files, realtime events, AI status, patches, task payloads, and execution events.

## Storage Model

### PostgreSQL

Stores Project, Room, ProjectMember, ProjectInvitation, TaskRun, AiPatch, PatchFileChange, ActivityEvent, ProjectSnapshot metadata, and execution-session metadata.

### Liveblocks

Stores or distributes active presence, cursors, selections, room chat, AI status, execution events, patch decisions, and collaborative coordination.

### Vercel Blob

Stores project snapshots, exported archives, patch artifacts, generated reports, and persisted logs. Prisma stores references only.

### WebContainer Filesystem

Temporary running copy inside the execution host's browser. It is not authoritative and is rebuilt from the durable project state.

## Collaborative Document Abstraction

UI components must use project-level hooks or services instead of importing multiple realtime providers throughout the app.

The abstraction should support opening a file document, reading and editing collaborative content, publishing selections, observing versions, file operations, and producing snapshots.

The internal implementation may use Liveblocks-compatible storage, Yjs, or a combination chosen for reliability.

## Access Model

Roles:

- OWNER
- EDITOR
- VIEWER
- AI

Rules:

- Every protected route requires Clerk authentication.
- Project access derives from ownership or ProjectMember records.
- Invitation acceptance must match an authenticated email.
- Share links never bypass authorization.
- AI acts through a system identity constrained by the requesting user's permissions.

## Permission Matrix

| Action | Owner | Editor | Viewer |
| --- | --- | --- | --- |
| View files | Yes | Yes | Yes |
| Edit files | Yes | Yes | No |
| Send chat | Yes | Yes | Yes |
| Run code | Yes | Yes | No |
| Invoke AI | Yes | Yes | No |
| Review/revert patch | Yes | Yes | No |
| Invite/change roles | Yes | No | No |
| Delete project | Yes | No | No |

## Starter Templates

Static codebase snapshots:

- React + Vite
- Node.js API
- Vanilla TypeScript

Each includes files, contents, default open file, run command, optional test command, and preview configuration.

## File Model and Limits

- Multi-file text workspace
- Maximum file size: 1 MB
- Maximum project snapshot: 10 MB
- Binary files rejected or ignored
- Executable uploads rejected
- Paths normalized and traversal blocked
- Protected files blocked from AI

## Snapshot Model

Create snapshots after two seconds of inactivity, every thirty seconds while changes continue, immediately before and after accepted AI patches, and best-effort on exit.

Snapshots contain the file tree, text contents, project configuration, runtime metadata, version, and timestamp.

## Execution Architecture

The user pressing Run becomes the temporary execution host.

The host creates the WebContainer, mounts the latest snapshot, starts commands, streams output, publishes preview state, and owns standard input. Others see read-only output.

If the host leaves, mark the session disconnected, preserve output, and allow another Owner or Editor to restart. Do not migrate the process.

Initial allowed commands:

- `npm install`
- `npm run <declared-script>`
- `npm test`
- `npm start`
- `npm run dev`
- explicitly approved `npx` commands

## AI Architecture

The user-facing identity is **Code Bro**. One visible participant uses specialized internal workflows for explanation, debugging, patch generation, testing, and review.

Allowed context includes prompt, selected code, open files, retrieved relevant files, manifests, test results, terminal output, and summarized room history.

Protected files, secrets, unrelated binary files, and data outside the project are disallowed.

Initial limits:

- One active AI run per room
- Five changed files per initial patch
- Three autonomous steps
- Visible cancellation
- Run timeout
- Per-user rate limiting
- Command approval when required

## Patch Architecture

Statuses:

- DRAFT
- GENERATING
- READY_FOR_REVIEW
- ACCEPTED
- REJECTED
- FAILED
- REVERTED

A patch stores requester, task run, prompt, explanation, base project version, affected files, edits or diff, test results, reviewer, timestamps, and previous snapshot.

## Patch Application

1. Verify reviewer role.
2. Verify patch status.
3. Verify base project version.
4. Create a pre-apply snapshot.
5. Apply all changes atomically.
6. Mark accepted.
7. Publish updates.
8. Create a post-apply snapshot.
9. Record activity.
10. Optionally run approved tests.

Stale patches are blocked and must be regenerated.

## Revert Model

Reverting restores the snapshot created immediately before patch application. It requires Owner or Editor permission, preserves history, publishes restored state, and records a REVERTED event.

## Invariants

1. Long-running AI work belongs in Trigger.dev.
2. Project access is enforced before room access.
3. Viewers are read-only for code, execution, AI, and patches.
4. Protected files never enter AI context.
5. AI never applies code without a valid patch decision.
6. Patch application is atomic.
7. Stale patches are never force-applied automatically.
8. WebContainer state is temporary.
9. Realtime state is not the only durable copy.
10. Large artifacts do not belong directly in PostgreSQL.
11. UI components do not own infrastructure policy.
12. Only one AI run is active per room in the MVP.
