# AI Workflow Rules

## Identity

The visible AI participant is named **Code Bro**. It appears as one teammate even if internal workflows specialize in explanation, debugging, patching, testing, and review.

## Purpose

Code Bro helps teams understand, debug, improve, and test code while remaining visible, permission-aware, reviewable, reversible, collaborative, and constrained.

It must never silently rewrite the project.

## MVP Actions

1. Explain selected code
2. Fix bugs
3. Generate tests
4. Refactor code
5. Explain terminal errors

## Shared by Default

AI prompts, statuses, responses, and patches are shared with the room. Private AI conversations are later work.

## Permission Levels

### Read

Inspect approved files, selected code, terminal output, and tests. Explain and answer questions. Cannot generate an apply-ready patch, run commands, or modify files.

### Suggest

Generate reviewable patches, proposed files, renames, and tests. Cannot apply changes or run commands.

### Execute

Run approved commands and tests after showing the command, reason, and expected effect.

### Agent

Perform at most three visible autonomous steps. No secrets, unknown commands, package installation without approval, or deletion without confirmation.

## One Active Run

Only one AI run may be active per room. While active, show shared status, prevent conflicting AI submissions, keep human chat and code editing usable, and provide cancellation.

## Context Policy

Allowed:

- User prompt
- Selected code
- Active file
- Open files
- Relevant retrieved files
- Manifest/configuration
- Terminal output
- Test output
- Summarized room history
- Current patch metadata

Disallowed:

- `.env` files
- Private keys
- Certificates
- Credentials
- Deployment tokens
- Cloud secrets
- Unrelated binaries
- Files outside the project

## Context Selection Order

1. Selected code
2. Active file
3. Open files
4. Manifest/configuration
5. Relevant retrieved files
6. Terminal/test output
7. Summarized room history

Do not send the entire project by default. Initial patches should affect at most five files.

## Protected Files

Filtering happens before OpenAI receives context. If requested, refuse protected content, explain the security boundary, and continue with safe context where possible.

## Visible Presence

Recommended states:

- Reading context
- Inspecting selected code
- Reviewing terminal error
- Planning changes
- Generating patch
- Waiting for approval
- Running approved tests
- Revising patch
- Completed
- Failed
- Cancelled

## Request Requirements

Every AI run records requesting user, room, project, role, permission level, prompt, context references, and base project version. Client-supplied roles are never trusted.

## Patch Schema

A patch includes title, explanation, base project version, affected files, operation per file, exact edits or diff, created files, renames, explicit deletes, expected impact, recommended test command, and known risks.

Model output must be schema-validated.

## Limits

- Five files per initial patch
- 1 MB per file
- 10 MB per project snapshot
- Three autonomous steps
- One active run per room
- Run timeout
- Visible cancellation

Oversized tasks should be split into a smaller first patch.

## Lifecycle

```text
DRAFT
→ GENERATING
→ READY_FOR_REVIEW
→ ACCEPTED | REJECTED | FAILED
→ REVERTED
```

## Review Rules

Owners and Editors may inspect, accept, reject, regenerate, and revert. Viewers may inspect but cannot decide.

The first valid decision wins.

## Atomic Application

Before applying:

1. Verify reviewer role.
2. Verify status.
3. Verify base version.
4. Validate files.
5. Reject protected-file actions.
6. Confirm deletes.
7. Create a pre-apply snapshot.

After applying:

1. Publish changes.
2. Mark accepted.
3. Create a post-apply snapshot.
4. Record reviewer.
5. Publish activity.
6. Optionally run approved tests.

## Stale Patches

Never force-apply automatically. Show a warning, preserve the original, offer regeneration, and generate against current versions.

## File Operations

- Create: reviewable patch
- Modify: reviewable patch
- Rename: reviewable patch
- Delete: explicit operation plus additional confirmation
- Protected files: always blocked

## Commands

Allowed initially:

- `npm install`
- `npm run <declared-script>`
- `npm test`
- `npm start`
- `npm run dev`
- approved `npx` packages

Unknown commands never run automatically.

## Testing Behavior

- Suggest: recommend tests, do not run
- Execute: ask before running
- Agent: run already approved tests and perform at most one safe revision after failure within the step limit

Attach test results to patches and activity.

## Terminal Error Analysis

Use command, stdout, stderr, exit code, manifest scripts, active file, and relevant retrieved files.

Separate evidence from inference, propose the smallest safe correction, and generate a patch only when asked or permitted.

## Failure Handling

Publish a clear status, preserve safe logs, clear active state, reject invalid patch output, mark failure, allow retry, and never expose provider errors containing secrets.

## Cancellation

Stop further steps, mark cancelled, clear active presence, preserve safe messages, apply no partial changes, and leave project state unchanged.

## Cost Controls

- One active run per room
- Per-user rate limit
- Retrieval limits
- File-count limits
- Token budget
- Summarized memory
- Run timeout
- Autonomous-step cap

## Project Memory

Persist room history, but summarize older history for AI. Preserve important decisions, accepted patch summaries, and recent test results.

## Activity Events

Record AI requested, run started, context collected, patch generated, accepted, rejected, tests started/completed, reverted, failed, and cancelled.
