# UI Context

## Visual Direction

Code Bros uses a dark-only technical workspace that feels focused, collaborative, modern, and developer-oriented. There is no light mode in the hackathon version.

## Theme Rules

Use CSS custom properties in `globals.css` mapped to semantic Tailwind tokens. Do not use raw Tailwind palettes or hardcoded colors when a semantic token exists.

Palette direction:

- Brand: cyan
- AI: indigo-purple
- Execution/success: green
- Warning: amber
- Error: red
- Collaborators: fixed accessible color palette

## Typography

- UI: Geist Sans
- Code and terminal: Geist Mono
- Editor: Monaco's configured monospace stack

## Radius Scale

- Small controls: `rounded-xl`
- Panels/cards: `rounded-2xl`
- Modals/overlays: `rounded-3xl`

## Icons

Use Lucide React stroke icons only.

## Branding

- Product: Code Bros
- AI participant: Code Bro
- Logo: compact `CB` lettermark combined with `</>`

The logo should work in the navbar, favicon, AI avatar, Devpost thumbnail, and video watermark.

## Landing Page

Include:

1. Header
2. Concise hero and CTA
3. Features
4. How it works
5. Supported languages
6. Build Week badge
7. Final CTA

Avoid oversized heroes, unnecessary gradients, fake logos, pricing sections, and heavy decorative animation.

## Workspace Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Navbar: project / run / invite / AI status / account        │
├──────────────┬────────────────────────────┬──────────────────┤
│ File         │ Monaco editor              │ AI sidebar       │
│ explorer     │                            │ AI / Chat /       │
│              │                            │ Changes           │
│              ├────────────────────────────┴──────────────────┤
│              │ Terminal / Tests / Preview / Activity        │
└──────────────┴───────────────────────────────────────────────┘
```

Use resizable panels, not a fully draggable dock layout. Explorer, AI sidebar, and bottom panel can be collapsed.

## Navbar

### Left

- Code Bros logo
- Project name
- Save state
- Explorer toggle

### Center

- Run/Stop
- Execution host
- Preview action
- AI activity status

### Right

- Invite/share
- Participant avatars
- Overflow count
- Clerk user menu

## File Explorer

Include create, upload, export, file tree, context actions, role-aware disabled states, and lock indicators for protected files.

## Editor

Use Monaco with open-file tabs, collaboration state, remote cursors, selections, diagnostics, language mode, selected-code actions, and an AI context indicator.

## Presence

Collaborators appear as an overlapping avatar group with names, colors, avatars or initials, and optional current-file metadata.

The current user uses Clerk's UserButton rather than a duplicate avatar.

Code Bro appears separately with an AI accent ring, idle/active state, and short status.

## AI Sidebar

Tabs:

- AI
- Chat
- Changes

### AI

Shared prompt thread, Code Bro status, prompt input, permission mode, context summary, and cancel action.

### Chat

Human room conversation with sender, timestamp, and shared history. Human chat should remain distinct from AI workflow status.

### Changes

Patch list, status, changed files, explanation, diff, test results, accept, reject, regenerate, and revert.

## Bottom Panel

Tabs:

- Terminal
- Tests
- Preview
- Activity

Terminal shows shared output, execution host, command metadata, disconnected state, and read-only status for non-hosts.

Tests show pass/fail summary and link results to the relevant AI patch or command.

Preview embeds the running web app and includes reload and safe open-in-new-tab actions.

Activity shows meaningful events rather than every keystroke.

## AI Status Labels

- Reading context
- Inspecting selected code
- Reviewing terminal error
- Generating patch
- Waiting for approval
- Running approved tests
- Completed
- Failed
- Cancelled

## Patch Review UI

Show requester, prompt, explanation, status, base version, changed-file count, per-file diff, test results, and decision controls.

Use success semantics for additions, error semantics for deletions, warnings for stale or blocked actions, and labels/icons in addition to color.

## Responsive Behavior

The landing page is responsive. The full IDE is desktop-first. On small screens, show that a larger display is required rather than compressing the entire workspace.

## Accessibility

- Visible keyboard focus
- Keyboard navigation in tabs/dialogs
- Labels for icon buttons
- No color-only status communication
- Accessible collaborator colors
- Readable code/terminal fonts
- Reduced-motion support
