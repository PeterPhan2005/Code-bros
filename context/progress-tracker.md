# Progress Tracker

Update this file whenever the phase, active feature, scope, or implementation state changes.

## Product

Code Bros — Build an AI Live Coding Collaborator

## Deadline

July 21, 2026

## Team

Solo developer

## Current Phase

Phase 2 — File Workspace

## Current Goal

Review Feature 07 — Monaco Editor after completing the browser-only Monaco integration, multi-file editing state, conflict-safe persistence, and role-aware workspace behavior.

## Product Decisions Completed

- Product: Code Bros
- AI participant: Code Bro
- Initial users: students, freelancers, hackathon teams
- Future users: enterprise teams
- Persistent projects
- One default room per project for MVP
- Authenticated email invitations and share links
- Owner, Editor, Viewer, AI roles
- Monaco Editor
- Liveblocks realtime
- PostgreSQL + Prisma
- Clerk
- Trigger.dev
- OpenAI
- Vercel Blob
- WebContainers for JavaScript/TypeScript execution
- Reviewable AI patches
- Shared AI presence
- Automatic snapshots and activity timeline
- React task-management demo
- Desktop-first resizable workspace

## Hackathon MVP

### Foundation

- Authentication
- Project creation/list
- Persistent default room
- Role-based membership
- Email invitations
- Authorized room link

### Workspace

- Multi-file explorer
- Monaco editor
- Create, rename, delete, upload, export
- React + Vite template
- Node.js API template
- Vanilla TypeScript template

### Collaboration

- Realtime editing
- Presence avatars
- Live cursors
- Text selections
- Room chat
- Shared AI status

### Execution

- WebContainer host model
- Run project
- Shared terminal output
- Tests
- Web preview
- Host-disconnect state

### AI

- Explain selected code
- Explain terminal errors
- Fix bugs
- Generate tests
- Refactor code
- Visible Code Bro participant
- Smart retrieval
- Protected-file filtering
- Shared AI messages
- One active run per room

### Patches

- Structured patch generation
- Diff review
- Accept/reject
- Stale detection
- Atomic application
- Revert
- Pre/post snapshots
- Activity integration

### Persistence

- Two-second autosave debounce
- Thirty-second durable snapshots
- Blob snapshots
- Project restore
- Patch artifact persistence

## Later Roadmap

- Multiple rooms
- Guest collaborators
- Python/Java execution
- Folder operations
- Global search
- GitHub integration
- Driver/navigator mode
- Private AI prompts
- Full snapshot history
- Enterprise administration
- Billing
- Mobile workspace
- Multiple AI providers
- Plugins

## Recommended Build Order

### Phase 1 — Foundation

1. Design system
2. Clerk authentication
3. Prisma project, room, member, invitation models
4. Project APIs
5. Project home
6. Workspace access shell

### Phase 2 — File Workspace

7. Starter templates
8. File tree model
9. Monaco multi-file editor
10. Create/rename/delete
11. Upload/export
12. Snapshots and restore

### Phase 3 — Collaboration

13. Liveblocks auth
14. Collaborative file documents
15. Presence
16. Cursors/selections
17. Room chat
18. Role-aware editing

### Phase 4 — Execution

19. WebContainer initialization
20. Host coordination
21. Shared terminal
22. Tests
23. Preview
24. Host disconnection

### Phase 5 — AI

25. AI sidebar shell
26. Shared AI status
27. AI room messages
28. OpenAI trigger/token flow
29. Protected context retrieval
30. Explain code
31. Explain terminal errors

### Phase 6 — Patches

32. Patch database model
33. Patch task
34. Changes tab/diff
35. Accept/reject
36. Stale detection
37. Atomic apply
38. Pre/post snapshots
39. Revert
40. Tests after approval

### Phase 7 — Demo Polish

41. Activity timeline
42. Loading/failure/disconnected states
43. Landing page
44. Build Week branding
45. Demo fixture
46. Demo script
47. Deployment
48. Video
49. Submission materials

## Critical Demo Path

```text
Sign in
→ Open React project
→ Join with second participant
→ Edit collaboratively
→ Run failing tests
→ Ask Code Bro to debug
→ Watch shared AI status
→ Review multi-file patch
→ Accept patch
→ Run approved tests
→ See passing result and updated preview
→ Revert patch if demonstrated
```

## Scope Risks

### High

- Collaborative Monaco editing
- WebContainer synchronization
- Structured multi-file patches
- Stale detection
- OpenAI retrieval
- Reliable two-user demo

### Medium

- Upload/export
- Invitations
- Activity timeline
- Revert UI
- Test formatting

### Lower

- Landing page
- Static templates
- Basic CRUD
- Avatars
- Chat

## Scope Protection

- No Python execution before JS/TS is stable.
- No GitHub integration before patch review.
- No multiple visible AI agents.
- No voice/video.
- No fully draggable IDE layout.
- No enterprise expansion.
- No billing.
- No private AI chats.
- No arbitrary server-side execution.

## Definition of Demo Ready

1. Two authenticated users enter one room.
2. Both edit without destructive conflicts.
3. Presence and selections are visible.
4. An authorized user runs the project.
5. Shared terminal shows a failing test.
6. Code Bro inspects the error and files.
7. Code Bro generates a valid patch.
8. An Editor accepts it.
9. Both users receive changes.
10. Tests pass.
11. Preview updates.
12. Activity records the sequence.
13. Refresh restores state.
14. Protected files never enter AI context.
15. The flow repeats reliably for video.

## In Progress

Feature 07 — Monaco Editor (implementation complete, pending interactive review)

## Feature 06 Delivered

- Persistent `ProjectNode` file/folder hierarchy with active and deleted lifecycle states
- Case-insensitive active sibling uniqueness for root and nested nodes
- Transactional starter files during project creation
- Authenticated read queries and Owner/Editor write authorization
- Create, rename, move, recursive soft-delete, and content-update services
- Cycle, protected-node, parent, collision, and 1 MB content validation
- Flat-list tree construction, deterministic derived paths, and malformed-tree safety
- Project file explorer with nested tree, selection, previews, action menus, dialogs, empty states, and loading/error states
- Applied `add_project_file_system` migration
- Passing Prisma validation, TypeScript, lint, production build, and focused database/domain checks

## Feature 07 Delivered

- Browser-only Monaco integration through `@monaco-editor/react` with a recoverable loading boundary
- Code Bros dark Monaco theme and restrained editor settings
- Lazy authenticated file-content loading without preloading project contents
- Stable file-ID-based tabs, per-file Monaco models, URI generation, view state, undo state, and model disposal
- Multi-file tab activation, horizontal overflow, accessible dirty indicators, and neighboring-tab close behavior
- Manual save through the toolbar and `Ctrl+S`/`Cmd+S`
- Saved, saving, dirty, failed, conflict, and read-only status states
- Atomic expected-revision persistence with explicit conflict review and overwrite confirmation
- Save ordering that preserves newer edits typed while an earlier save is pending
- Dirty-tab Save and Close, Close Without Saving, and Cancel flows
- Rename, move, extension/language, and recursive deletion synchronization for open files
- Viewer read-only enforcement in Monaco and on the server
- Browser unload warnings and guarded project switching while files are dirty
- Passing Prisma validation, TypeScript, lint, production build, and focused editor reducer checks
- Signed-in browser interaction review remains pending because browser control was unavailable in the implementation session

## Next Up

Feature 08 — Realtime collaboration

## Open Questions

- Exact collaborative text binding
- Final OpenAI model/workflow based on credits
- WebContainer fallback behavior
- Exact package installation policy

## Architecture Decisions

- One visible AI participant with specialized workflows
- Reviewable patches before changes
- One active AI run per room
- One default room per project
- Share links require authentication
- Viewers are read-only for code, execution, AI, and patches
- Execution starter is the temporary browser host
- Shared output, host-controlled input
- PostgreSQL stores metadata
- Blob stores project and patch artifacts
- Realtime state is not the only durable source
- Protected files are filtered before OpenAI context
