# Development Workflow

## Approach

Build Code Bros incrementally using a spec-driven workflow. Context files define the product, architecture, UI rules, AI behavior, and current progress.

Do not begin implementation from vague ideas. Resolve each feature into a small specification with scope, implementation requirements, limits, and verification checks.

## Primary Goal

Prioritize the hackathon demo path:

```text
Collaborative edit
→ failing test
→ shared terminal context
→ Code Bro analysis
→ reviewable patch
→ approval
→ passing tests
→ updated preview
```

Features that do not directly support this path are secondary before July 21, 2026.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small verifiable increments.
- Do not combine unrelated boundaries in one implementation step.
- Keep UI, realtime, execution, AI, and persistence work separate unless an end-to-end slice explicitly requires them.
- Do not add roadmap features while critical-path features remain unstable.

## When to Split Work

Split a feature if it combines:

- UI and durable AI task logic
- collaborative document state and snapshot persistence
- WebContainer execution and AI patch generation
- multiple unrelated API routes
- invitation management and editor collaboration
- patch generation and patch application
- behavior not yet defined in context files

If a unit cannot be tested end to end quickly, it is too broad.

## Required Feature Specification Format

Each feature file should contain:

1. Goal
2. Context and dependencies
3. Implementation requirements
4. Data or event contracts
5. Permission rules
6. Failure states
7. Scope limits
8. Check when done

## Handling Missing Requirements

- Do not invent product behavior.
- Add unresolved decisions to `progress-tracker.md`.
- Resolve architecture changes in `architecture-context.md` before implementation.
- Resolve UI changes in `ui-context.md`.
- Resolve AI permissions or behavior in `ai-workflow-rules.md`.
- Record scope cuts explicitly.

## Protected Foundation

Do not modify generated third-party foundation components unless explicitly required.

This includes:

- `components/ui/*`
- Monaco internals
- Liveblocks internals
- WebContainer internals
- Clerk internals

Wrap and compose these systems in project-specific modules.

## Build Order Discipline

Follow the phases in `progress-tracker.md` unless a dependency requires a small adjustment.

Do not begin advanced AI patch automation before:

- project access works
- collaborative files work
- snapshots work
- execution output is reliable
- protected-file filtering exists

Do not begin demo polish before the critical flow works with two users.

## Verification Levels

### Static Verification

- TypeScript passes
- lint passes
- production build passes
- schemas compile
- no server-only code leaks into clients

### Single-User Verification

- feature works in one browser
- permissions are correct
- loading and error states are visible
- refresh restores expected state

### Multi-User Verification

Required for realtime features:

- test with two authenticated sessions
- verify current user is excluded from remote presence
- verify Viewer restrictions
- verify updates propagate both directions
- verify disconnect behavior

### AI Verification

- protected files are excluded
- output is schema-valid
- cancellation clears AI state
- failure creates no partial applied changes
- patch base version is checked
- one active run limit works

### Execution Verification

- host starts and stops commands
- observers receive output
- non-host input is blocked
- host disconnection is visible
- project state survives execution restart

## Documentation Synchronization

Update context when implementation changes:

- architecture boundary
- data ownership
- storage decisions
- role permissions
- AI behavior
- execution policy
- feature scope
- current progress

`progress-tracker.md` must describe actual implementation state, not intended state.

## Before Marking a Unit Complete

1. The feature works in its defined scope.
2. Relevant role checks are enforced server-side.
3. Failure and loading states are handled.
4. No architecture invariant is violated.
5. Realtime features are tested with two sessions.
6. TypeScript, lint, and build pass.
7. Context documents are synchronized.
8. Progress tracker is updated.

## Demo Protection

Before the deadline:

- freeze non-critical feature additions once the central flow works
- maintain a known-good demo project
- use deterministic prompts and test failures
- keep a fallback recorded demo path
- avoid dependency upgrades without necessity
- verify production deployment after every major phase
- keep a clean seed project for repeated recordings

## Scope-Cut Order

If time becomes limited, cut in this order:

1. Python editing polish
2. File upload
3. Project export
4. Advanced invitation management
5. Full activity filtering
6. Patch revert UI polish
7. Multiple starter templates beyond React
8. Nonessential landing-page animation

Do not cut:

- collaborative editing
- shared terminal output
- Code Bro visible status
- reviewable patch
- accept/reject
- protected-file filtering
- persistence
- reliable demo fixture
