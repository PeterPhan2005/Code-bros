# Code Bros

## Overview

Code Bros is a real-time collaborative coding workspace where developers and an AI teammate can edit, review, debug, run, and discuss code together inside one shared environment.

The product is designed first as a hackathon-ready demo for student developers and freelancers working on small projects. It should prove that AI can behave like a visible engineering collaborator rather than a private sidebar chatbot. Enterprise capabilities may be explored later if the product receives funding.

## Product Problem

Developers currently switch between code editors, video calls, chat tools, terminals, code review tools, and AI assistants. Code Bros combines collaborative editing, execution, discussion, and AI assistance in one persistent workspace.

## Product Positioning

Code Bros is not just an online editor. Its defining idea is that **Code Bro**, the AI teammate, is visible to everyone in the room and participates in the same workflow as human developers.

Code Bro can inspect relevant files, explain selected code, analyze terminal errors, generate tests, refactor code, propose bug fixes, create reviewable multi-file patches, run approved commands, and publish visible status updates.

## Primary Users

### Initial Users

- Student developers
- Hackathon teams
- Freelancers building small projects
- University project teams

### Future Users

- Professional software teams
- Enterprise engineering organizations
- Paid collaborative development teams

Enterprise permissions, billing, compliance, audit exports, and organization management are not part of the hackathon scope.

## Core Differentiators

1. **AI as a visible room participant** — Code Bro appears with a name, avatar, status, and visible activity.
2. **Reviewable AI patches** — AI changes are proposed as patches that Owners and Editors can inspect, accept, reject, or revert.
3. **AI debugging with shared execution context** — Code Bro can use terminal output, test results, selected code, open files, and relevant project files.

## Project Model

```text
Project
└── Coding Room
    ├── Files
    ├── Participants
    ├── Chat
    ├── Terminal
    └── AI Activity
```

For the MVP, each project has one default persistent room. The data model should allow multiple rooms later.

## Core User Flow

1. A user signs in.
2. The user creates a project.
3. The user selects a starter template.
4. The persistent coding room opens.
5. The owner invites collaborators by email and shares the room link.
6. Participants edit project files together.
7. Participants see presence avatars, cursors, selections, and chat.
8. An Owner or Editor runs the project.
9. Shared terminal, test, and preview output appears.
10. A participant asks Code Bro to explain, debug, refactor, or generate tests.
11. Code Bro reads approved context and publishes visible status updates.
12. Code Bro proposes a reviewable patch.
13. An Owner or Editor accepts or rejects it.
14. Accepted changes apply atomically to the shared workspace.
15. The activity timeline records the request, reviewer, patch, test result, and outcome.
16. The project is autosaved and can be restored later.

## Authentication and Access

Authentication is required. Guest collaborators with temporary names may be added later.

Access is granted through email invitation and authenticated project membership. Shareable room links navigate to the room but never bypass authorization.

## Roles

### Owner

Can view and edit files, run code, invoke AI, review patches, invite collaborators, change roles, and delete the project.

### Editor

Can view and edit files, run code, invoke AI, review patches, and use chat. Cannot manage ownership or delete the project.

### Viewer

Can view files, participants, terminal output, previews, activity, and room chat. Cannot edit, run code, invoke AI, or review patches.

### AI Participant

Visible in room presence. Reads only approved context, publishes progress and results, proposes changes, and cannot access protected files or secrets.

## Collaborative Editing

The editor supports multi-file projects, CRDT conflict resolution, participant presence, live cursors, live selections, room chat, shared AI status, and persistent workspace state.

## Supported Languages

### Hackathon MVP

- JavaScript
- TypeScript

These support editing, execution, tests, package scripts, and web preview.

### Partial Support

Python files may be created, edited, discussed, and reviewed by AI, but Python execution is not guaranteed in the first version.

## Starter Templates

- React + Vite
- Node.js API
- Vanilla TypeScript

## File Operations

The MVP supports create, rename, delete, upload supported text files, and project export. Folder operations, global search, and GitHub import come later.

## Code Execution

The hackathon version uses WebContainers for Node.js-compatible projects.

- The participant pressing Run becomes the temporary execution host.
- The host browser runs the project.
- Terminal output, tests, and preview status are broadcast to the room.
- Other participants can view output but cannot type into the active process.
- Another Owner or Editor may take control after execution stops.
- Processes are not migrated if the host leaves.

## AI Capabilities

1. Explain selected code
2. Fix bugs
3. Generate tests
4. Refactor code
5. Explain terminal errors

AI may use the user prompt, selected code, open files, relevant retrieved files, manifests, terminal output, test results, and summarized room history. It must never read or expose protected secrets.

## AI Permission Levels

### Read

Inspect approved context, explain code, answer questions, and analyze terminal output.

### Suggest

Generate reviewable patches without applying changes or running commands.

### Execute

Run approved commands and tests after showing the command and receiving permission.

### Agent

Perform a limited visible sequence of at most three autonomous steps while respecting protected files, command approval, and cancellation.

## Patch Review Flow

```text
User request
→ AI context collection
→ Patch generation
→ Patch ready for review
→ Accept or reject
→ Apply atomically if accepted
→ Run approved tests
→ Record activity
```

Statuses:

```text
DRAFT
→ GENERATING
→ READY_FOR_REVIEW
→ ACCEPTED | REJECTED | FAILED
→ REVERTED
```

A patch records requester, prompt, explanation, affected files, structured edits or diff, test results, reviewer, timestamps, and the previous snapshot reference.

If a patch becomes stale, it must not be applied. The user may regenerate it against the latest code.

## Protected Files

Protected patterns include `.env`, `.env.*`, private keys, certificates, credential files, generated secrets, deployment tokens, and known cloud-provider credential files.

Protected content must never be sent to OpenAI, copied into chat, displayed in AI output, included in patches, or included in activity summaries.

## Persistence and History

- Debounced autosave after two seconds of inactivity
- Durable snapshot every thirty seconds while changes continue
- Immediate snapshot before applying an AI patch
- Immediate snapshot after accepting an AI patch
- Best-effort save on page exit
- Activity timeline for human and AI actions
- MVP support for reverting an entire accepted AI patch

## Landing Page

Include product features, how it works, supported languages, a Build Week badge, and a clear call to action.

The coding workspace is desktop-first. The landing page remains responsive.

## Hackathon Demo Scenario

The main demo uses a React task-management application.

1. Two developers join the same project.
2. Both edit it in real time.
3. A state or API bug causes tests to fail.
4. Shared terminal output shows the failure.
5. Code Bro visibly enters a working state.
6. Code Bro inspects relevant files and output.
7. Code Bro proposes a reviewable multi-file patch.
8. Collaborators inspect the diff.
9. An Editor accepts it.
10. Approved tests run and pass.
11. The preview updates.
12. The activity timeline records the sequence.

## Central Wow Moment

Code Bro sees the same failing terminal output as the team, visibly becomes active, identifies the relevant files, proposes a reviewable multi-file patch, runs approved tests, and updates every collaborator's editor in real time.

## Hackathon Success Criteria

1. Authenticate and create a persistent project.
2. Start from a supported template.
3. Edit simultaneously with another user.
4. Show presence, cursors, selections, and chat.
5. Run JavaScript/TypeScript projects in a WebContainer.
6. Share terminal and preview state.
7. Explain code and terminal errors.
8. Generate a reviewable patch.
9. Accept or reject it.
10. Apply accepted changes for all collaborators.
11. Revert an accepted AI patch.
12. Restore the project from persistence.
13. Reliably record the full demo flow.

## Out of Scope for the Hackathon

- Voice/video calls
- Anonymous public rooms
- Full GitHub synchronization
- Git branches and merge conflict workflows
- Full debugger
- Enterprise administration
- Billing
- Mobile IDE
- Self-hosted arbitrary code execution
- Multiple AI providers
- Plugin marketplace
- Private AI conversations
- Guaranteed Python execution
