# 07-monaco-editor.md

> Read `AGENTS.md` before starting.

# Feature 07 — Monaco Editor

## Objective

Integrate Monaco Editor into the Code Bros project workspace.

This feature turns the file-system workspace from `06-file-system.md` into a functional browser-based code editor.

Users must be able to:

* open project files
* switch between open files
* edit supported text files
* preserve unsaved editor state while switching tabs
* save file content to PostgreSQL
* see file language and save status
* close editor tabs
* recover safely from save conflicts and failures
* use keyboard shortcuts expected from a code editor

Monaco must operate on stable project node IDs and persistent file records.

Do not implement real-time collaboration, AI code generation, WebContainers, terminals, Git, or version history in this feature.

---

## Dependencies

* `01-design-system.md`
* `02-editor.md`
* `03-auth.md`
* `04-database.md`
* `05-projects.md`
* `06-file-system.md`

---

# Editor Principles

## Monaco Is the Editing Surface

Monaco owns the browser editing experience, including:

* cursor behavior
* selections
* syntax highlighting
* editor commands
* text models
* undo and redo
* keyboard editing behavior
* language services supported by Monaco

Do not build a custom text editor using:

* `textarea`
* `contenteditable`
* custom token rendering
* manual cursor management

## PostgreSQL Remains the Persistent Source of Truth

Monaco models contain active browser editing state.

PostgreSQL remains the authoritative persistent source for saved file content.

Unsaved Monaco content must not be treated as permanently stored.

## Stable File IDs Own Editor Identity

Use the database file node ID as the stable application identity for:

* open tabs
* active file
* unsaved state
* save requests
* model lookup
* future collaboration mapping

Do not use mutable file paths or names as the primary editor identity.

## One Model Per Open File

Each open text file should have one Monaco text model.

Switching tabs must switch the editor’s active model rather than replacing the value of one shared model.

This preserves per-file:

* undo history
* cursor position
* selection
* scroll position
* unsaved content
* language configuration

## Server Authorization Remains Required

Opening a file in Monaco does not grant permission to save it.

Every file-content mutation must verify:

* authenticated identity
* project access
* project write permission
* file ownership by the requested project
* active file status
* file type
* content size

## Narrow Client Boundary

Monaco requires browser APIs and must run in a Client Component.

Keep:

* project authentication
* project access checks
* initial file-tree loading
* initial file-content loading where practical

on the server.

Only editor interaction and local model state should require client-side execution.

---

# Scope

Implement:

* Monaco Editor dependency
* client-only Monaco loading
* Code Bros Monaco theme
* editor loading state
* file tabs
* open-file state
* active-file state
* one Monaco model per open file
* file-content loading
* file editing
* manual save
* keyboard save shortcut
* save status
* unsaved-change tracking
* editor read-only mode
* close-tab behavior
* dirty-tab confirmation
* cursor and view-state preservation
* file rename synchronization
* file deletion synchronization
* language detection integration
* save conflict detection
* database persistence
* editor empty state
* editor error state
* editor settings appropriate for the MVP

Do not implement:

* real-time collaboration
* Liveblocks
* collaborative cursors
* AI inline completions
* AI chat
* AI patch application
* WebContainers
* terminal
* code execution
* debugger
* Git integration
* minimap customization UI
* editor preference persistence
* multi-pane editing
* split editors
* diff editor
* file version history
* command palette
* extension marketplace
* binary file editing
* image preview
* Markdown preview
* automatic formatting service
* LSP servers outside Monaco’s built-in language support

---

# Dependencies

Install:

```bash
npm install @monaco-editor/react monaco-editor
```

Use versions compatible with the repository’s current React and Next.js versions.

Do not install multiple competing Monaco React wrappers.

Use:

```text
@monaco-editor/react
```

as the React integration.

---

# Client-Only Loading

Monaco depends on browser APIs.

Do not import the Monaco editor into a Server Component.

Create a client-only boundary.

Suggested structure:

```text
components/
  editor/
    code-editor.tsx
    code-editor-client.tsx
```

The outer workspace may remain server-rendered.

The Monaco component must be loaded in a Client Component using a browser-safe integration.

When dynamic loading is required, use:

```ts
dynamic(() => import("./code-editor-client"), {
  ssr: false,
})
```

The `ssr: false` dynamic import must be declared inside a Client Component.

Do not attempt to render Monaco during server-side rendering.

Do not access:

* `window`
* `document`
* Monaco browser APIs

during server rendering.

---

# Editor Workspace Layout

Update the project workspace created in `06-file-system.md`.

Expected composition:

```text
EditorShell
  ProjectWorkspace
    FileExplorer
    EditorWorkspace
      EditorTabs
      MonacoEditor
      EditorStatusBar
```

The Projects sidebar remains an application-level overlay.

The File Explorer remains a project-level panel.

The Monaco editor occupies the main workspace area.

Do not merge the File Explorer and editor tabs into the Projects sidebar.

---

# Editor Workspace Component

Create:

```text
components/editor/editor-workspace.tsx
```

This component coordinates:

* open files
* active file
* editor tabs
* model registry
* save state
* Monaco view state
* file lifecycle events

Suggested props:

```ts
interface EditorWorkspaceProps {
  projectId: string;
  projectRole: "OWNER" | "EDITOR" | "VIEWER";
  initialTree: ProjectNodeListItem[];
  initialFileId?: string | null;
}
```

Do not pass all project file contents during initial page loading.

File content should load when a file is opened.

---

# Editor State Model

Create explicit types for editor state.

Suggested location:

```text
lib/editor/editor.types.ts
```

Suggested types:

```ts
interface OpenEditorFile {
  id: string;
  projectId: string;
  name: string;
  language: string;
  savedContent: string;
  currentContent: string;
  savedUpdatedAt: string;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
}

interface EditorTab {
  fileId: string;
  name: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
}
```

The exact state representation may vary, but it must distinguish:

* last saved content
* current editor content
* dirty state
* save state
* save error
* server revision timestamp

Do not determine dirty state only from the tab name or a temporary visual flag.

---

# Editor Controller

Create a focused editor controller.

Suggested files:

```text
hooks/use-editor-workspace.ts
lib/editor/editor-reducer.ts
```

The controller should manage:

* open file IDs
* active file ID
* loaded file metadata
* loading states
* save states
* close requests
* rename updates
* deletion updates

Use:

* `useReducer`
* or another predictable local state approach

Do not add a global state library solely for editor tabs.

The state should remain scoped to the active project workspace.

---

# File Opening

Selecting a file in the File Explorer must open it in Monaco.

## Open Flow

1. Verify the selected node is a file.
2. Set it as the active file.
3. Reuse the existing loaded model when already open.
4. Otherwise load its content.
5. Create one Monaco model for the file.
6. Add a tab.
7. activate the tab.
8. restore its saved editor view state when available.

Do not create duplicate tabs for the same file ID.

## Folder Selection

Selecting a folder should only:

* expand it
* collapse it
* select it for contextual actions when needed

Folders must not open as editor tabs.

## File Loading

Use the authenticated file-content query established in `06-file-system.md`.

The request must include:

```ts
{
  projectId: string;
  fileId: string;
}
```

The server must verify that the file:

* belongs to the project
* is active
* is a file
* is accessible to the current user

Do not trust file metadata already present in the client tree as authorization.

---

# File Content Loading Strategy

Do not preload every file’s content.

Load content only when a user opens a file.

Benefits:

* smaller initial payload
* faster project loading
* reduced memory use
* reduced database transfer
* better scaling for large trees

Cache loaded file content within the active workspace session.

Reopening an already loaded file should reuse its current Monaco model and unsaved state.

Do not refetch and overwrite an unsaved model without explicit conflict handling.

---

# Monaco Model Registry

Create a model registry that maps:

```text
fileId → Monaco text model
```

Suggested location:

```text
lib/editor/monaco-model-registry.ts
```

or manage it through refs inside the editor workspace.

The registry must:

* create at most one active model per open file
* return an existing model when the file is already loaded
* update language when a file extension changes
* dispose models when they are no longer required
* avoid creating duplicate models during React re-renders
* avoid leaking models across project navigation

Do not place Monaco model instances in serializable React state.

Use refs or an equivalent non-serializable registry.

---

# Model URI

Create a stable Monaco URI for every file.

Suggested URI format:

```text
file:///projects/{projectId}/{fileId}/{encodedFileName}
```

The URI must include the stable file ID.

Do not use only:

```text
file:///{path}
```

because file paths can change after rename or move operations.

The URI should be unique for each project file.

## Rename Behavior

Monaco model URIs cannot be treated as freely mutable application identifiers.

When a rename requires a URI update:

1. preserve the current model content
2. preserve dirty state
3. preserve view state
4. create or transition to the updated model safely
5. dispose the obsolete model when no longer referenced

The application file ID remains the canonical identity even if the Monaco URI changes.

---

# Model Creation

When opening a file:

1. create a Monaco URI
2. check whether a model already exists for that URI
3. reuse it when valid
4. otherwise create a text model with:

   * file content
   * detected language
   * stable URI
5. store the model under the file ID

Do not repeatedly call model creation on every render.

Do not call `setValue()` when switching between already-open files.

Switch the editor model instead.

---

# Model Disposal

Dispose Monaco models when:

* the file tab is closed and the application does not preserve closed-file state
* the file is deleted
* the user navigates to another project
* the editor workspace unmounts
* a renamed model is safely replaced

Also dispose related Monaco resources created by this feature, including:

* subscriptions
* content listeners
* editor commands when scoped manually
* decorations
* temporary markers owned by the feature

Do not dispose shared Monaco language services globally.

Do not leak models after project navigation.

---

# View State Preservation

Preserve per-file Monaco view state.

Use Monaco editor view state to preserve:

* cursor position
* selection
* scroll position
* folded regions when supported

Before switching away from a file:

1. save the active model’s view state
2. store it by file ID

After switching to a file:

1. set its Monaco model
2. restore its previous view state
3. focus the editor when appropriate

Do not reset the cursor to line 1 every time the user changes tabs.

Store view states in a ref rather than serializable state.

---

# Code Editor Component

Create:

```text
components/editor/code-editor-client.tsx
```

Use:

```tsx
<Editor />
```

from:

```text
@monaco-editor/react
```

Suggested responsibilities:

* initialize Monaco theme
* receive active model
* receive read-only state
* notify the controller of content changes
* expose editor mount lifecycle
* support focus behavior
* render a loading fallback
* preserve accessibility labels

Suggested props:

```ts
interface CodeEditorClientProps {
  fileId: string;
  model: MonacoEditor.ITextModel;
  readOnly: boolean;
  onChange: (fileId: string, value: string) => void;
  onMount?: (
    editor: MonacoEditor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => void;
}
```

The exact imported Monaco types may vary.

Do not use `any` for editor and model APIs when official types are available.

---

# Code Bros Monaco Theme

Create a custom Monaco theme based on the application’s dark design system.

Suggested location:

```text
lib/editor/monaco-theme.ts
```

Theme name:

```text
code-bros-dark
```

Use:

```ts
monaco.editor.defineTheme()
```

Define the theme once.

Do not redefine it on every render.

## Theme Requirements

The theme should align with existing Code Bros semantic colors for:

* editor background
* editor foreground
* line numbers
* active line
* selection
* inactive selection
* cursor
* whitespace
* indentation guides
* matching brackets
* find matches
* widget backgrounds
* hover surfaces
* borders
* errors
* warnings
* informational markers

Monaco theme definitions require concrete color values.

Read these values from the existing CSS custom properties at runtime where practical.

Create a controlled conversion utility when CSS variables use a format Monaco cannot consume directly.

Do not introduce unrelated hardcoded brand colors.

Fallback color values may be defined centrally only when required for Monaco initialization before computed styles are available.

Do not scatter color literals throughout editor components.

---

# Theme Synchronization

Dark mode is the primary Code Bros experience.

When the application theme changes:

* reapply or regenerate the appropriate Monaco theme
* avoid recreating file models
* avoid resetting editor content
* avoid losing cursor or view state

A separate light Monaco theme is not required unless the application already supports light mode.

Do not implement an editor-specific theme switcher in this feature.

---

# Monaco Options

Configure Monaco with restrained IDE-style defaults.

Recommended options:

```ts
{
  automaticLayout: true,
  minimap: {
    enabled: false,
  },
  fontSize: 14,
  lineHeight: 22,
  fontLigatures: true,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorSmoothCaretAnimation: "on",
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  wordWrap: "off",
  folding: true,
  renderWhitespace: "selection",
  renderLineHighlight: "line",
  bracketPairColorization: {
    enabled: true,
  },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
  padding: {
    top: 12,
    bottom: 12,
  },
}
```

The exact option set may vary based on the installed Monaco version.

Do not expose every Monaco setting in the UI.

Avoid excessive visual noise.

## Minimap

Disable the minimap by default for the MVP.

It may be enabled later through editor preferences.

## Font

Use the project’s configured monospace font.

Provide a reliable monospace fallback.

Do not download or bundle additional font files solely for Monaco unless already approved by the design system.

## Automatic Layout

Enable automatic layout so Monaco responds to:

* file explorer width changes
* sidebar opening
* viewport resizing
* tab bar changes

Do not manually call layout on every render.

Call explicit layout only when required after a hidden-to-visible transition.

---

# Supported Languages

Map file extensions to Monaco language IDs.

Create or extend:

```text
lib/files/file-language.ts
```

Support at minimum:

| Extension | Monaco language |
| --------- | --------------- |
| `.ts`     | `typescript`    |
| `.tsx`    | `typescript`    |
| `.js`     | `javascript`    |
| `.jsx`    | `javascript`    |
| `.json`   | `json`          |
| `.css`    | `css`           |
| `.scss`   | `scss`          |
| `.html`   | `html`          |
| `.md`     | `markdown`      |
| `.py`     | `python`        |
| `.java`   | `java`          |
| `.sql`    | `sql`           |
| `.xml`    | `xml`           |
| `.yaml`   | `yaml`          |
| `.yml`    | `yaml`          |
| `.sh`     | `shell`         |
| `.txt`    | `plaintext`     |

Unknown extensions must use:

```text
plaintext
```

Do not throw an error for an unsupported language.

---

# TypeScript and JavaScript Defaults

Configure Monaco’s built-in TypeScript defaults carefully.

Suggested settings:

* allow modern JavaScript
* support JSX and TSX
* use a modern ECMAScript target
* disable automatic type acquisition that depends on unavailable external services
* avoid enabling unrestricted eager model synchronization
* avoid diagnostic settings that produce misleading errors for missing project dependencies

This feature does not yet provide a complete project-wide TypeScript compiler environment.

Do not imply that Monaco diagnostics equal a real project build.

Do not inject large dependency type definitions in this feature.

---

# Read-Only Mode

Users with the `VIEWER` role must receive a read-only editor.

Set Monaco’s read-only option based on server-resolved project access.

Read-only users may:

* open files
* select text
* copy content
* search inside files
* navigate code using available Monaco functionality

Read-only users may not:

* modify content
* save files
* trigger mutating editor commands

The save button and write-related shortcuts must not attempt mutations for viewers.

Do not rely only on Monaco’s `readOnly` UI option.

The server must continue rejecting unauthorized save requests.

---

# Editor Tabs

Create:

```text
components/editor/editor-tabs.tsx
components/editor/editor-tab.tsx
```

Display one tab for each open file.

Each tab should show:

* file icon
* file name
* dirty indicator
* close action
* active state

Do not show full paths by default.

A tooltip may display the current file path when available.

---

# Tab Behavior

## Opening

Opening a file adds a tab only when it is not already open.

## Activation

Clicking a tab activates its associated model.

## Reordering

Tab drag-and-drop reordering is not required.

Keep tabs in the order they were opened.

## Overflow

When tabs exceed available width:

* allow horizontal scrolling
* keep active tabs reachable
* avoid shrinking every tab to unreadable widths

Do not wrap tabs onto multiple lines.

## Active Tab

The active tab must have:

* visible active styling
* appropriate accessible state
* clear separation from inactive tabs

Do not communicate active state only through color.

---

# Dirty Indicator

A file is dirty when:

```text
currentContent !== savedContent
```

Display a subtle dirty indicator in the tab.

Recommended indicator:

* small dot
* modified marker replacing or appearing near the close icon

Do not append large labels such as `UNSAVED`.

The indicator must have an accessible label.

---

# Closing Tabs

Closing a clean file should:

1. remove its tab
2. dispose or retain its model according to the selected model-lifecycle policy
3. activate a neighboring tab when it was active
4. show the empty editor state when no tabs remain

Recommended next active tab:

1. tab immediately to the right
2. otherwise tab immediately to the left
3. otherwise no active file

## Dirty Tab Close

When closing a dirty file, open a confirmation dialog.

Create:

```text
components/editor/unsaved-changes-dialog.tsx
```

Actions:

* Save and Close
* Close Without Saving
* Cancel

## Save and Close

* save the file
* close only after successful save
* keep the dialog open if saving fails

## Close Without Saving

* restore or discard the unsaved Monaco model
* close the tab
* preserve the last saved database content

## Cancel

* close the confirmation dialog
* keep the file open
* preserve unsaved changes

Do not use `window.confirm()`.

---

# Editor Empty State

When no file is open, display a restrained empty editor state.

Suggested content:

```text
Open a file to start editing
```

```text
Choose a file from the explorer.
```

Optional keyboard hint:

```text
Use Ctrl+P or Cmd+P to open files.
```

Do not implement Quick Open unless that shortcut is actually supported.

Do not show keyboard hints for features that do not exist.

Do not wrap the empty state in a large card.

---

# Editor Loading State

While Monaco is loading:

* preserve the editor canvas dimensions
* show a restrained skeleton or loading surface
* avoid full-page spinners
* avoid layout shift
* keep the file explorer usable

Suggested text:

```text
Loading editor…
```

Do not display the loading state after Monaco has mounted successfully.

---

# File Loading State

When a selected file’s content is loading:

* keep tabs and explorer visible
* show a loading state in the editor canvas
* prevent duplicate open requests
* allow switching to another already-loaded file

Do not create a blank editable model before the actual content is resolved unless it is explicitly marked as loading.

This prevents accidental overwriting of server content with an empty model.

---

# Save Behavior

Implement explicit file saving.

Users with write access must be able to save through:

* editor toolbar or status action
* `Ctrl+S`
* `Cmd+S`

Use the `updateFileContentAction()` established in `06-file-system.md`, extended with conflict metadata.

Do not save on every keystroke.

---

# Save Input

Suggested input:

```ts
interface SaveFileInput {
  projectId: string;
  fileId: string;
  content: string;
  expectedUpdatedAt: string;
}
```

Do not accept:

* user ID
* project role
* file owner
* protection state
* arbitrary project association

The server resolves identity and authorization.

---

# Save Validation

The server must:

1. authenticate the user
2. require project write access
3. validate project and file IDs
4. verify the file belongs to the project
5. verify the node is active
6. verify the node is a file
7. validate content size
8. compare the expected server revision
9. persist content
10. update `updatedById`
11. return the new `updatedAt` revision

Do not expose raw database errors.

---

# Save Status

Display one of the following states:

```text
Saved
Saving…
Unsaved changes
Save failed
Conflict
```

The exact wording may be shortened in compact UI.

Save status must not rely only on color.

## State Rules

### Saved

The current model content matches the last confirmed saved content.

### Unsaved Changes

The user has changed the model since the last successful save.

### Saving

A save request is active.

### Save Failed

The latest save failed and the local changes remain unsaved.

### Conflict

The server file changed after the editor loaded or last saved it.

---

# Save Button

Add a compact save control in the editor workspace or status bar.

Use a Lucide icon such as:

```text
Save
```

Requirements:

* disabled for viewers
* disabled when no file is active
* disabled when the file is clean
* disabled during an active save
* accessible label
* tooltip with keyboard shortcut
* pending feedback

Do not create a visually dominant primary button.

---

# Keyboard Save Shortcut

Register:

```text
Ctrl+S
Cmd+S
```

Behavior:

* prevent the browser’s default page-save dialog
* save the active file
* do nothing when no file is active
* do not mutate when the editor is read-only
* avoid duplicate save requests
* preserve editor focus

Prefer Monaco commands or a properly scoped client keyboard listener.

Clean up manually registered listeners when the editor unmounts.

Do not register duplicate handlers after re-renders.

---

# Save Request Ordering

Multiple save requests may complete out of order.

Protect editor state from stale responses.

Each save request should track:

* file ID
* content snapshot
* expected revision
* request sequence or identifier

When a save succeeds:

* update `savedContent` only to the content confirmed by that request
* update the server revision
* preserve dirty state when the user typed newer changes during the save

Example:

1. user saves content A
2. user continues typing content B
3. save A succeeds
4. editor must remain dirty because B is not yet saved

Do not mark the entire file clean merely because any save request succeeded.

---

# Optimistic Concurrency

Prevent silent overwrites.

Extend the file update service to compare:

```text
expectedUpdatedAt
```

with the current database `updatedAt`.

The update should succeed only when the expected revision matches.

Use an atomic conditional update or equivalent transaction-safe mechanism.

Do not implement the conflict check as:

1. separate read
2. unconditional write

without transaction or conditional protection.

---

# Save Conflict

A conflict occurs when the server file changed after the current editor revision was loaded.

Do not automatically overwrite the server version.

Display a conflict dialog.

Create:

```text
components/editor/save-conflict-dialog.tsx
```

Actions:

* Review Server Version
* Overwrite Server Version
* Cancel

## Review Server Version

Load the current server content.

For this feature, display a simple comparison view or clearly separated local and server content.

A full Monaco diff editor is not required.

## Overwrite Server Version

Require explicit confirmation.

The server must perform a fresh authorized update.

Do not allow viewers to overwrite.

## Cancel

Keep the local unsaved model unchanged.

Do not silently discard local work.

---

# Manual Reload

Provide a restrained reload action when a file load or conflict requires refreshing from the server.

Reloading a clean file may replace its local model content.

Reloading a dirty file must require confirmation.

Do not overwrite dirty local content without a user decision.

---

# Autosave

Do not implement full autosave in this feature.

Manual save is the required persistence behavior.

The architecture should allow a later autosave feature to add:

* debounce timing
* save queues
* offline recovery
* collaboration-aware persistence

Do not create an incomplete timer-based autosave that can produce race conditions.

---

# Navigation With Unsaved Changes

Users may navigate away from the current project while files are dirty.

Implement a best-effort browser unload warning when one or more files contain unsaved changes.

Use:

```text
beforeunload
```

only while dirty files exist.

Clean up the listener when no dirty files remain.

The browser controls the final warning message.

## Internal Navigation

For known application navigation actions such as:

* selecting another project
* closing the active project
* deleting the current project

provide an application confirmation flow where practical.

Do not claim that all Next.js navigation can be perfectly blocked without a supported routing interception mechanism.

At minimum:

* protect explicit project-switch controls
* warn on browser unload
* preserve dirty files during normal tab switching

---

# File Rename Synchronization

When a file is renamed through the File Explorer:

* update the matching tab name
* update the file icon when extension changes
* update the Monaco language
* preserve unsaved content
* preserve dirty state
* preserve view state
* safely update model URI when necessary

Do not close and reopen the file in a way that discards unsaved content.

Folder renames should update displayed paths or tooltips for descendant files when paths are derived.

Stable file IDs remain unchanged.

---

# File Move Synchronization

When an open file or its parent folder moves:

* preserve the open tab
* preserve the model
* preserve unsaved state
* update derived path displays
* update model URI only when the chosen URI strategy includes path information

Moving a file must not create a duplicate tab.

---

# File Delete Synchronization

When an open file is deleted:

* close its tab
* dispose its Monaco model
* remove stored view state
* remove pending save state
* activate a neighboring tab
* show the empty editor state when no tabs remain

When a folder is deleted:

* close all open descendant files
* dispose all corresponding models
* remove their local editor state

A successful server deletion should be authoritative.

Do not retain editable tabs for deleted nodes.

---

# Protected Files

Protected files may still be editable when project rules allow editing.

Protection from `06-file-system.md` applies primarily to:

* rename
* move
* delete

Do not assume `isProtected` means read-only unless the file-system specification explicitly defines that behavior.

The editor must derive read-only behavior from:

* project role
* future file-specific permissions

not from UI assumptions.

---

# Content Change Handling

Use Monaco’s content change event to update the active file’s current content.

Requirements:

* identify changes by stable file ID
* update dirty state efficiently
* do not issue a server request on every change
* do not rebuild the full file tree
* do not recreate the Monaco model
* do not store Monaco model objects in React state

Avoid copying very large content repeatedly when an equivalent model version strategy can be used safely.

For the MVP size limit, string comparison is acceptable, but keep the logic centralized.

---

# Model Version Tracking

Track Monaco model version IDs when useful.

A file state may include:

```ts
modelVersionId: number;
lastSavedAlternativeVersionId: number;
```

Dirty state may use Monaco’s alternative version IDs to avoid repeated full-content comparison.

However, server content snapshots must still be available for confirmed save behavior and conflict handling.

Use one consistent dirty-state strategy.

Do not mix multiple conflicting definitions of “saved.”

---

# Editor Toolbar

Create a restrained editor toolbar only when necessary.

Suggested content:

* active file path
* save action
* save status
* read-only badge for viewers

Do not add:

* run button
* terminal button
* AI button
* Git controls
* formatting settings
* language selector

Those belong to later features.

---

# Editor Status Bar

Create:

```text
components/editor/editor-status-bar.tsx
```

Suggested information:

* cursor line and column
* language
* indentation
* save status
* read-only status

Keep the status bar compact.

Do not imitate the entire VS Code status bar.

## Cursor Position

Update cursor position from Monaco cursor events.

Display:

```text
Ln 12, Col 8
```

Do not trigger expensive React updates for every cursor movement across unrelated workspace components.

Keep cursor state local to the editor status area where practical.

---

# Language Display

Display the active Monaco language.

Examples:

```text
TypeScript
JavaScript
JSON
Markdown
Plain Text
```

Do not provide manual language switching in this feature.

Language is derived from the file extension.

---

# Editor Accessibility

The Monaco editor must include an accessible label.

Suggested label:

```text
Code editor for {fileName}
```

Tabs must support:

* keyboard focus
* accessible names
* selected state
* close controls with labels
* visible focus indicators

Icon-only buttons must include:

* `aria-label`
* tooltip text where appropriate

Dialogs must preserve:

* focus trapping
* focus return
* keyboard actions
* accessible titles
* accessible descriptions

Do not remove Monaco’s built-in accessibility support.

---

# Screen Reader Mode

Do not disable Monaco’s accessibility features.

Allow Monaco to detect or support screen-reader-optimized behavior.

Avoid custom keyboard handlers that interfere with:

* text navigation
* copy and paste
* selection
* undo and redo
* browser accessibility shortcuts

Do not intercept broad keyboard combinations unnecessarily.

---

# Loading and Error Boundaries

## Monaco Load Failure

If Monaco fails to load:

* keep the File Explorer visible
* show a concise editor error
* provide a retry action
* do not expose stack traces
* do not fall back to an editable `textarea`

Suggested message:

```text
The code editor could not be loaded.
```

## File Load Failure

Keep the tab or loading placeholder clearly marked.

Allow:

* retry
* close tab

Do not create an editable empty file that could overwrite the failed load.

## Save Failure

Keep local Monaco content unchanged.

Mark the file as dirty.

Display a concise error.

Allow retry.

Do not dispose the model after a failed save.

---

# Data Fetching

Initial project metadata and file tree should remain server-loaded where practical.

File content may be loaded through:

* a protected Server Action
* a protected Route Handler
* another established server query boundary

Choose one consistent approach.

Do not expose Prisma directly to the browser.

Do not create one API style for reads and another arbitrary style for writes without a clear repository convention.

---

# File Content Route

When using a Route Handler, suggested route:

```text
app/
  api/
    projects/
      [projectId]/
        files/
          [fileId]/
            route.ts
```

Supported methods may include:

```text
GET
PUT
```

When using Server Actions, keep actions in the established server-only file service structure.

Do not implement both approaches for the same operation.

---

# Editor Session Persistence

Persisting open tabs across browser refresh is optional.

For the initial feature:

* open tabs may reset on refresh
* the initial file may be selected from a URL query parameter
* or the workspace may begin with no open file

Do not use local storage as the authoritative file content store.

A later workspace-preferences feature may persist:

* open tab IDs
* active file ID
* explorer expansion
* editor preferences

---

# Optional File Route State

The active file may be reflected in the URL using a query parameter:

```text
/editor/{projectId}?file={fileId}
```

This is optional for the MVP.

When implemented:

* validate file access server-side or during file loading
* do not trust the query parameter
* avoid adding a browser history entry for every tab switch unless intentional
* preserve stable file IDs

Do not put unsaved content in the URL.

---

# Editor Commands

Support Monaco’s standard built-in commands.

At minimum, preserve:

* undo
* redo
* find
* replace
* select all
* copy
* paste
* comment toggle where language support exists
* indentation commands

Do not override standard shortcuts unless Code Bros implements a complete replacement.

Custom command required:

```text
Save File
```

Optional command:

```text
Close Active Tab
```

using:

```text
Ctrl+W
Cmd+W
```

Only register Close Active Tab when it can safely avoid closing the browser tab unexpectedly.

If implemented, dirty-file confirmation must still apply.

---

# Formatting

Do not implement external Prettier integration in this feature.

Monaco may expose built-in formatting only when the registered language provider supports it.

Do not show a Format Document action unless it reliably works for the active language.

A later formatting feature may integrate project configuration.

---

# Diagnostics

Use Monaco’s built-in diagnostics where available.

Do not add server compiler errors yet.

Do not treat Monaco markers as persisted project diagnostics.

Do not save markers to PostgreSQL.

When changing or disposing models:

* clear feature-owned markers
* dispose feature-owned diagnostic resources

Do not create fake errors for unsupported imports.

---

# Performance Constraints

* Monaco must be loaded client-side only.
* Do not preload all file contents.
* Use one model per open file.
* Reuse models when switching tabs.
* Do not call `setValue()` on every render.
* Do not recreate the editor when switching files.
* Dispose unused models.
* Dispose editor subscriptions.
* Avoid duplicate content requests.
* Keep Monaco instances out of serializable React state.
* Avoid rerendering the entire project workspace on cursor movement.
* Avoid saving on every keystroke.
* Avoid loading unnecessary Monaco languages manually.
* Preserve stable editor dimensions while loading.
* Use automatic layout instead of frequent manual resize calls.
* Limit open model memory through tab closure behavior.

---

# Security Constraints

* Monaco must never receive database credentials.
* File content queries must verify project access.
* File saves must verify project write access.
* Viewer sessions must remain read-only.
* Client-provided roles must be ignored.
* File IDs must not grant authorization.
* Files must be verified as members of the requested project.
* Deleted files must not load or save.
* Folder nodes must not load as text files.
* Content size must be validated server-side.
* Expected revision data must be validated.
* Conflict overrides require explicit user action.
* Raw Prisma errors must not reach the browser.
* Unsaved content must not be logged.
* File content must not be placed in analytics events.
* Prisma must remain server-only.

---

# File Structure

Expected structure:

```text
app/
  (app)/
    editor/
      [projectId]/
        page.tsx
        loading.tsx

components/
  editor/
    code-editor.tsx
    code-editor-client.tsx
    editor-status-bar.tsx
    editor-tab.tsx
    editor-tabs.tsx
    editor-toolbar.tsx
    editor-workspace.tsx
    save-conflict-dialog.tsx
    unsaved-changes-dialog.tsx

hooks/
  use-editor-workspace.ts
  use-unsaved-changes-warning.ts

lib/
  editor/
    editor-reducer.ts
    editor.types.ts
    monaco-model-registry.ts
    monaco-theme.ts
    monaco-uri.ts

  files/
    file.actions.ts
    file-language.ts
    file.queries.ts
    file.service.ts
    file.types.ts
```

Use equivalent repository conventions when they already exist.

Do not duplicate:

* language detection
* file access checks
* file save validation
* Monaco model creation
* dirty-state logic
* save result handling

---

# Implementation Sequence

1. Install Monaco dependencies.
2. Create the Monaco client-only loading boundary.
3. Create shared editor types.
4. Create the Code Bros Monaco theme.
5. Extend file-language mapping.
6. Create stable Monaco URI generation.
7. Implement the Monaco model registry.
8. Implement editor workspace state.
9. Build the editor tab bar.
10. Build the editor status bar.
11. Build the Monaco editor client component.
12. Wire file selection to file-content loading.
13. Create one Monaco model per open file.
14. Implement model switching.
15. Preserve view state per file.
16. Implement dirty-state tracking.
17. Extend file saving with expected revision checks.
18. Implement manual save.
19. Implement `Ctrl+S` and `Cmd+S`.
20. Protect save request ordering.
21. Implement save status.
22. Implement dirty-tab close confirmation.
23. Implement conflict handling.
24. Synchronize file rename events.
25. Synchronize file move events.
26. Synchronize file deletion events.
27. Add read-only viewer behavior.
28. Add Monaco, file-loading, and save error states.
29. Add unsaved browser-unload warning.
30. Verify model and listener disposal.
31. Run lint and production build checks.

---

# Check When Done

* `@monaco-editor/react` is installed.
* `monaco-editor` is installed.
* Monaco loads only in the browser.
* Monaco is not imported into a Server Component.
* Monaco renders inside the existing project workspace.
* The File Explorer remains visible.
* The Projects sidebar behavior remains unchanged.
* A stable loading state appears while Monaco loads.
* Monaco load failures show a recoverable error.
* Code Bros uses a dedicated Monaco theme.
* The Monaco theme aligns with the existing design system.
* Theme initialization does not run on every render.
* Supported file extensions map to Monaco languages.
* Unknown files use plaintext mode.
* Selecting a file opens it in a tab.
* Selecting a folder does not open an editor tab.
* Opening the same file twice does not create duplicate tabs.
* File content loads only when a file is opened.
* The full project tree query does not include file contents.
* Every open file uses a separate Monaco model.
* Switching tabs switches Monaco models.
* Switching tabs does not call `setValue()` on a shared model.
* Undo history remains separate for each open file.
* Cursor position is preserved per file.
* Scroll position is preserved per file.
* Unsaved content remains when switching tabs.
* Active tabs are visually and accessibly identified.
* Tabs support horizontal overflow.
* Dirty files display an accessible modified indicator.
* Clean tabs close without confirmation.
* Dirty tabs open the unsaved-changes dialog.
* Save and Close waits for successful persistence.
* Close Without Saving discards only local unsaved content.
* Cancel preserves the dirty tab.
* Closing the active tab selects a neighboring tab.
* Closing the final tab displays the editor empty state.
* Owners can edit and save files.
* Editors can edit and save files.
* Viewers receive a read-only editor.
* Viewers cannot trigger save mutations.
* Read-only status is visible.
* `Ctrl+S` saves the active file.
* `Cmd+S` saves the active file.
* Browser page-save behavior is prevented while the editor handles save.
* Duplicate save requests are prevented.
* Save status distinguishes saved, dirty, saving, failed, and conflict states.
* A completed stale save does not incorrectly clear newer dirty content.
* Save requests include an expected revision.
* Server-side save conflict detection is atomic.
* Conflicts do not silently overwrite server content.
* Conflict UI preserves local changes.
* File size limits are enforced server-side.
* File access is verified server-side before loading.
* File write permission is verified server-side before saving.
* Deleted files cannot be opened or saved.
* Folder nodes cannot be loaded as files.
* Renaming an open file updates its tab.
* Renaming a file updates its Monaco language when required.
* Renaming preserves unsaved content.
* Moving an open file preserves its tab and model.
* Deleting an open file closes its tab.
* Deleting a folder closes all descendant tabs.
* Deleted models are disposed.
* Project navigation disposes project models.
* Editor unmount cleans up listeners.
* No Monaco model objects are stored in serializable React state.
* No file contents are logged.
* No raw Prisma errors are displayed.
* No generated `components/ui/*` files are modified.
* `npm run lint` passes.
* `npm run build` passes.

---

# Unlocks

* `08-realtime-collaboration.md`
* Liveblocks room authorization
* collaborative text editing
* user presence
* remote cursors and selections
* collaboration-aware save behavior
* AI Engineer project context
* AI-generated code patches
* Monaco diff review
* WebContainer file mounting
* browser code execution
* terminal integration
* project snapshots
* file version history
