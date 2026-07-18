# 06-file-system.md

> Read `AGENTS.md` before starting.

# Feature 06 — Project File System

## Objective

Implement the persistent project file system for Code Bros.

This feature introduces the file and folder model used by every project workspace. Users must be able to create, view, rename, move, and soft-delete project files and folders while preserving project permissions and database consistency.

The file system established here will become the source of project context for:

* Monaco editor models
* real-time collaboration
* AI Engineer analysis
* code execution
* snapshots
* activity history
* future version control features

Do not implement Monaco editing, Liveblocks synchronization, AI patches, or code execution in this feature.

---

## Dependencies

* `01-design-system.md`
* `02-editor.md`
* `03-auth.md`
* `04-database.md`
* `05-projects.md`

---

# File System Principles

## PostgreSQL Owns File Metadata

PostgreSQL is the source of truth for:

* file and folder identity
* hierarchy
* names
* paths
* project ownership
* content location
* lifecycle state
* timestamps

Do not store the authoritative project tree only in:

* React state
* browser storage
* Monaco models
* Liveblocks storage
* in-memory objects
* client-side file maps

## File Content and File Metadata Are Separate

File metadata belongs in PostgreSQL.

File content may initially be stored in PostgreSQL for small MVP source files, but the service architecture must keep content access isolated so it can later move to object storage without rewriting the editor or project tree.

UI components must not depend on the physical content storage strategy.

## The Tree Is Server-Validated

The browser may request file operations, but it must not decide whether:

* a parent folder exists
* a node belongs to a project
* a name is unique
* a move creates a cycle
* a user has edit permission
* a protected node may be changed

All structural operations must be validated server-side.

## Stable IDs Over Paths

Files and folders must use stable database IDs.

Paths are derived navigation and display values.

Do not use a mutable path as:

* the primary key
* the permission boundary
* the collaboration room identity
* the only reference to an open file
* the permanent relation between future records

Renaming or moving a file must not change its identity.

## Every Node Belongs to One Project

A file-system node must belong to exactly one project.

A node must never be moved directly between projects.

Cross-project copy or import belongs to a later feature.

## Soft Deletion Preserves Recoverability

Normal user deletion should mark nodes as deleted instead of immediately destroying them.

Future cleanup or snapshot systems may permanently remove unreachable content later.

---

# Scope

Implement:

* persistent file and folder models
* project file-tree queries
* root-level and nested files
* root-level and nested folders
* create file
* create folder
* rename node
* move node
* soft-delete node
* recursive folder deletion behavior
* file content updates through a server service
* project file explorer
* node action menus
* empty states
* server-side permission checks
* protected default files
* initial project file generation
* deterministic path calculation

Do not implement:

* Monaco Editor
* collaborative cursors
* Liveblocks document state
* AI-generated patches
* file version history
* snapshots
* code execution
* file uploads
* binary files
* drag-and-drop uploads
* Git integration
* search across files
* project import
* package installation
* multi-project moves
* permanent trash cleanup

---

# Database Schema Changes

Extend the Prisma schema established in `04-database.md`.

Add:

* `ProjectNode`
* `NodeType`
* `NodeStatus`

Update the `Project` model with its file-system relationship.

---

# Project Node Model

Use one hierarchical node model for both files and folders.

Suggested schema:

```prisma
model ProjectNode {
  id          String     @id @default(cuid())
  projectId   String
  parentId    String?

  name        String
  type        NodeType
  status      NodeStatus @default(ACTIVE)

  content     String?
  language    String?
  mimeType    String?

  isProtected Boolean    @default(false)
  sortOrder   Int        @default(0)

  createdById String
  updatedById String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  project     Project     @relation(
    fields: [projectId],
    references: [id],
    onDelete: Cascade
  )

  parent      ProjectNode? @relation(
    "ProjectNodeChildren",
    fields: [parentId],
    references: [id],
    onDelete: Restrict
  )

  children    ProjectNode[] @relation("ProjectNodeChildren")

  createdBy   User         @relation(
    "ProjectNodeCreator",
    fields: [createdById],
    references: [id],
    onDelete: Restrict
  )

  updatedBy   User?        @relation(
    "ProjectNodeUpdater",
    fields: [updatedById],
    references: [id],
    onDelete: SetNull
  )

  @@unique([projectId, parentId, name])
  @@index([projectId, parentId, status])
  @@index([projectId, type])
  @@index([parentId])
  @@index([updatedAt])
}
```

Update related models with equivalent relation fields.

The exact relation names may vary, but the domain constraints must remain equivalent.

---

# Node Type

Create:

```prisma
enum NodeType {
  FILE
  FOLDER
}
```

## `FILE`

A file may contain text content and language metadata.

A file must not have child nodes.

## `FOLDER`

A folder may contain files and other folders.

A folder must not contain file content.

These invariants must be enforced in the service layer.

---

# Node Status

Create:

```prisma
enum NodeStatus {
  ACTIVE
  DELETED
}
```

Normal file-tree queries must return only active nodes.

When a node is deleted:

```text
status = DELETED
deletedAt = current timestamp
```

Restoration is not implemented in this feature.

---

# Field Rules

## `projectId`

Every node belongs to one project.

All parent and child relationships must stay within the same project.

Never trust a client-provided project relationship without verifying it against the parent node and authenticated route context.

## `parentId`

`null` represents a root-level node.

When `parentId` is present:

* the parent must exist
* the parent must belong to the same project
* the parent must be active
* the parent must be a folder

A file cannot be a parent.

## `name`

A node name must:

* be trimmed
* contain at least one visible character
* contain no more than 120 characters
* not contain `/`
* not contain `\`
* not equal `.`
* not equal `..`
* avoid control characters
* be unique among active siblings

Recommended rejected characters:

```text
/
\
\0
```

Do not silently change user-entered names beyond trimming unless generating an initial default.

## `content`

Only files may contain content.

Folders must store:

```text
content = null
```

For the MVP, file content may be stored as text.

Do not store binary data in this field.

## `language`

Optional editor language identifier.

Examples:

```text
typescript
javascript
json
css
html
markdown
python
plaintext
```

Language detection should primarily derive from the file extension.

The field may cache the detected language for efficient editor loading.

## `mimeType`

Optional textual MIME type.

Examples:

```text
text/typescript
text/javascript
application/json
text/css
text/html
text/markdown
text/x-python
text/plain
```

## `isProtected`

Protected nodes cannot be renamed, moved, or deleted through normal user actions.

This supports project-critical files such as:

* project manifest
* runtime configuration
* generated system files

Protection must be verified server-side.

Do not rely only on hiding menu actions.

## `sortOrder`

Provides deterministic manual ordering support.

For the initial feature, tree display may order by:

1. folders before files
2. `sortOrder`
3. name alphabetically

Do not build manual reordering UI unless required for moving nodes.

## `createdById`

References the application user who created the node.

Resolve this from the authenticated server session.

Do not accept it from the client.

## `updatedById`

Store the latest user responsible for a structural or content update when available.

---

# Sibling Name Uniqueness

Active sibling nodes must not share the same name.

Examples that must be rejected within one folder:

```text
src
src
```

```text
index.ts
index.ts
```

A file and folder must also not share the same name under the same parent.

The database compound constraint provides final collision protection.

Because nullable values can behave differently in unique constraints across databases, verify that root-level sibling uniqueness behaves correctly in PostgreSQL.

When necessary, enforce root-level uniqueness in the service layer or with an appropriate partial database index.

Do not assume the nullable compound constraint alone guarantees the required root behavior.

---

# Case Sensitivity

Treat sibling names as case-sensitive at the database level for the MVP unless the configured PostgreSQL collation behaves otherwise.

However, prevent confusing duplicates where practical.

Recommended application behavior:

* reject exact duplicates
* warn or reject case-only duplicates such as `Index.ts` and `index.ts`

Use one consistent policy throughout the application.

Do not allow behavior to differ between create, rename, and move operations.

---

# File Size Limits

This feature supports small text source files only.

Recommended maximum content size:

```text
1 MB per file
```

Validate content size before persistence.

Do not load or save arbitrarily large files through normal editor operations.

The limit should be centralized as a reusable constant.

Suggested location:

```text
lib/files/file.constants.ts
```

Example:

```ts
export const MAX_TEXT_FILE_SIZE_BYTES = 1_048_576;
```

Do not hardcode the limit in multiple components.

---

# Initial Project Files

Update project creation so every new project receives a minimal starter file system.

The project and initial nodes must be created in the same transaction.

Recommended JavaScript/TypeScript MVP structure:

```text
src/
  index.ts

package.json
README.md
```

Suggested initial content:

## `src/index.ts`

```ts
console.log("Welcome to Code Bros");
```

## `package.json`

```json
{
  "name": "code-bros-project",
  "private": true,
  "scripts": {
    "start": "tsx src/index.ts"
  }
}
```

## `README.md`

Use a short project-specific introduction.

Do not create large starter templates.

Do not install dependencies during project creation.

## Protected Defaults

Mark `package.json` as protected only if later execution features require strict preservation.

If it remains user-editable, do not mark it protected prematurely.

At least one system-critical file may be used to verify protected-node behavior, but avoid creating invisible or unnecessary files.

---

# Project Creation Transaction

Extend `createProject()` from `05-projects.md`.

The transaction must create:

1. the project
2. the owner membership
3. initial folders
4. initial files

If any step fails, no partial project should remain.

Do not create starter nodes through independent requests after project creation.

---

# File-System Queries

Create server-only query functions.

Suggested location:

```text
lib/files/file.queries.ts
```

Implement:

```ts
getProjectTree(projectId: string)
getProjectNode(projectId: string, nodeId: string)
getFileContent(projectId: string, fileId: string)
```

All queries must:

1. resolve the authenticated user
2. verify project access
3. reject deleted projects
4. exclude deleted nodes
5. return only required fields
6. avoid exposing inaccessible node existence

---

# Project Tree Query

`getProjectTree()` should return a flat serializable node list.

Recommended shape:

```ts
interface ProjectNodeListItem {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: "FILE" | "FOLDER";
  language: string | null;
  isProtected: boolean;
  sortOrder: number;
  updatedAt: string;
}
```

Prefer returning a flat list and constructing the visual tree in application code.

Benefits:

* simpler serialization
* easier updates
* easier collaboration integration
* easier optimistic state handling
* no deeply nested Prisma query

Do not return file content for the full tree.

---

# File Content Query

`getFileContent()` must:

* verify project access
* verify the node belongs to the project
* verify the node is active
* verify the node is a file
* return only editor-required content and metadata

Suggested shape:

```ts
interface ProjectFileContent {
  id: string;
  name: string;
  content: string;
  language: string;
  updatedAt: string;
}
```

Do not return the entire project tree again.

---

# File-System Permissions

Use the project roles established in `04-database.md`.

## Owner

May:

* view nodes
* create files
* create folders
* rename nodes
* move nodes
* edit file content
* delete unprotected nodes

## Editor

May:

* view nodes
* create files
* create folders
* rename unprotected nodes
* move unprotected nodes
* edit file content
* delete unprotected nodes

## Viewer

May:

* view the project tree
* open files
* read file content

May not:

* create
* rename
* move
* edit
* delete

The final authorization matrix may later become more granular, but this feature must enforce these minimum rules.

---

# Authorization Helpers

Extend the project access layer.

Suggested functions:

```ts
requireProjectReadAccess(projectId: string)
requireProjectWriteAccess(projectId: string)
requireProjectOwner(projectId: string)
```

File mutations must use write access.

Protected-node administrative changes may require project ownership.

Do not repeat role checks independently in every Server Action.

Centralize permission rules.

---

# Validation Schemas

Create:

```text
lib/files/file.schemas.ts
```

Use the existing validation library.

Implement schemas for:

* create file
* create folder
* rename node
* move node
* delete node
* update file content

Suggested inputs:

```ts
interface CreateFileInput {
  projectId: string;
  parentId?: string | null;
  name: string;
}

interface CreateFolderInput {
  projectId: string;
  parentId?: string | null;
  name: string;
}

interface RenameNodeInput {
  projectId: string;
  nodeId: string;
  name: string;
}

interface MoveNodeInput {
  projectId: string;
  nodeId: string;
  targetParentId: string | null;
}

interface DeleteNodeInput {
  projectId: string;
  nodeId: string;
}

interface UpdateFileContentInput {
  projectId: string;
  fileId: string;
  content: string;
}
```

Never accept role, owner, status, or protection state from normal client mutations.

---

# File Service

Create a server-only domain service.

Suggested location:

```text
lib/files/file.service.ts
```

The service should own:

* node lookup
* project relationship validation
* parent validation
* sibling uniqueness
* file extension and language detection
* cycle prevention
* protected-node rules
* recursive deletion
* content validation
* transactional mutations

Server Actions should remain thin.

---

# Create File

Implement:

```ts
createFile()
```

## Behavior

1. Resolve the authenticated user.
2. Require project write access.
3. Validate the input.
4. Validate the target parent.
5. Verify sibling-name availability.
6. Detect language and MIME type.
7. Create the file.
8. Revalidate the project workspace.
9. Return a UI-safe node result.

## Defaults

New files should use:

```text
content = ""
status = ACTIVE
```

When no extension is present:

```text
language = plaintext
mimeType = text/plain
```

Do not create a file with folder content semantics.

---

# Create Folder

Implement:

```ts
createFolder()
```

## Behavior

1. Resolve the authenticated user.
2. Require project write access.
3. Validate the input.
4. Validate the target parent.
5. Verify sibling-name availability.
6. Create the folder.
7. Revalidate the project workspace.
8. Return a UI-safe node result.

Folders must use:

```text
content = null
language = null
mimeType = null
```

---

# Rename Node

Implement:

```ts
renameNode()
```

## Behavior

* require project write access
* validate the new name
* verify the node belongs to the project
* reject deleted nodes
* reject protected nodes
* verify sibling-name uniqueness
* update language and MIME type when renaming a file changes its extension
* update `updatedById`
* revalidate the workspace

Renaming must not change:

* node ID
* project ID
* parent ID
* content
* child relationships

## No-Change Rename

When the normalized name is unchanged:

* return success without an unnecessary write
* or disable submission in the interface

---

# Move Node

Implement:

```ts
moveNode()
```

## Behavior

* require project write access
* verify the node belongs to the project
* reject protected nodes
* validate the target parent
* ensure the target belongs to the same project
* ensure the target is an active folder
* prevent sibling-name conflicts
* prevent cycles
* update `parentId`
* update `updatedById`
* revalidate the workspace

## Cycle Prevention

A folder must not be moved:

* into itself
* into one of its descendants

Before moving a folder, walk its ancestry or query descendants to verify that the target parent is not inside the folder’s subtree.

Do not rely on the client to prevent invalid drag-and-drop targets.

## Root Move

A `targetParentId` of `null` moves a node to the project root.

Root-level uniqueness rules still apply.

---

# Delete Node

Implement:

```ts
deleteNode()
```

Use soft deletion.

## File Deletion

Update:

```text
status = DELETED
deletedAt = current timestamp
updatedById = current user
```

## Folder Deletion

Deleting a folder must soft-delete:

* the folder
* all active descendants

Perform the operation transactionally.

Do not leave active descendants under a deleted parent.

## Protected Nodes

Protected nodes cannot be deleted through standard file actions.

When a folder contains a protected descendant:

* reject deletion of the folder
* do not partially delete the subtree

The user-facing error should explain that the folder contains protected files.

Do not expose internal database details.

---

# Update File Content

Implement a server-side content update service:

```ts
updateFileContent()
```

This feature prepares persistence for the editor, even though Monaco integration occurs later.

## Behavior

* require project write access
* validate file identity
* ensure the node is an active file
* enforce the file-size limit
* update content
* update `updatedById`
* update `updatedAt`
* return the new revision timestamp

Do not implement autosave timing in this feature.

Do not call this mutation on every keystroke from the current UI.

The Monaco feature will define save and synchronization behavior.

---

# Mutation Result Pattern

Reuse the typed action result established in `05-projects.md`.

File operations should return predictable outcomes for:

* validation failure
* unauthenticated access
* unauthorized access
* missing node
* sibling conflict
* protected node
* invalid parent
* cycle detection
* oversized content
* infrastructure failure

Do not expose raw Prisma errors.

---

# Server Actions

Create:

```text
lib/files/file.actions.ts
```

Implement thin Server Actions for:

```ts
createFileAction()
createFolderAction()
renameNodeAction()
moveNodeAction()
deleteNodeAction()
updateFileContentAction()
```

Each action should:

1. parse input
2. call the file service
3. return a typed result
4. revalidate affected routes when necessary

Do not place Prisma logic directly inside action functions.

---

# File Explorer

Create:

```text
components/editor/file-explorer.tsx
```

The file explorer displays the current project tree.

It should replace the minimal project workspace placeholder created in `05-projects.md`.

The editor workspace should now reserve a left-side explorer panel inside the project screen.

This explorer is separate from the floating Projects sidebar.

## Workspace Hierarchy

The workspace may contain:

```text
Project Sidebar Overlay
Editor Navbar
File Explorer
Editor Canvas Placeholder
```

The Projects sidebar remains an application-level overlay.

The File Explorer is a project-level panel.

Do not merge the two responsibilities.

---

# File Explorer Layout

The explorer should include:

* header
* project name
* tree content
* create actions
* contextual node actions
* empty state when no nodes exist

Suggested width:

```text
240px to 280px
```

The explorer may be collapsible later.

Do not implement complex resizing in this feature unless an existing panel primitive already supports it cleanly.

---

# Explorer Header

Display:

* current project name
* compact create menu or actions
* optional refresh action only when necessary

Recommended create actions:

* New File
* New Folder

Use Lucide icons such as:

* `FilePlus`
* `FolderPlus`
* `MoreHorizontal`

Avoid multiple visually dominant primary buttons.

---

# File Tree

Create reusable components:

```text
components/files/file-tree.tsx
components/files/file-tree-item.tsx
```

The tree must support:

* arbitrary nesting
* folder expand and collapse
* folder icons
* file icons
* active file state placeholder
* keyboard-operable actions
* node action menus
* folders before files
* deterministic ordering

Do not load children through one request per folder for the MVP.

Use the already-loaded flat project tree.

---

# Tree Construction

Create a pure utility:

```text
lib/files/build-file-tree.ts
```

Input:

```ts
ProjectNodeListItem[]
```

Output:

```ts
interface FileTreeNode extends ProjectNodeListItem {
  children: FileTreeNode[];
}
```

Requirements:

* construct the tree without mutating input
* handle root nodes
* sort folders before files
* apply stable alphabetical ordering
* tolerate missing parents safely
* avoid infinite recursion when malformed data is encountered

Malformed nodes should be excluded or placed in a safe fallback collection.

Do not crash the project workspace because of one invalid relationship.

Server-side invariants remain the primary protection.

---

# Node Icons

Use Lucide icons only.

Suggested mappings:

* closed folder: `Folder`
* open folder: `FolderOpen`
* general file: `File`
* TypeScript: `FileCode2`
* JSON: `Braces`
* Markdown: `FileText`

Do not introduce a second icon library for file-type icons.

Do not use brand logos for every programming language in this feature.

---

# Node Actions

Owned and editable project nodes should expose context actions.

For files:

* Rename
* Delete

For folders:

* New File
* New Folder
* Rename
* Delete

Move may initially be exposed through a dedicated dialog or simple destination picker.

Do not require drag-and-drop to complete this feature.

Viewers must not see mutation actions.

Protected nodes must not expose prohibited actions.

The server must still enforce all restrictions.

---

# Create Node Dialog

Create:

```text
components/files/create-node-dialog.tsx
```

Support both:

* file
* folder

Suggested props:

```ts
interface CreateNodeDialogProps {
  open: boolean;
  type: "file" | "folder";
  projectId: string;
  parentId: string | null;
  onOpenChange: (open: boolean) => void;
}
```

## Requirements

* use `AppDialog`
* include a name input
* auto-focus the input
* show the destination folder in the description
* submit on Enter
* show validation errors
* show pending state
* keep the dialog open on failure
* close on success

Suggested labels:

```text
New file
New folder
```

---

# Rename Node Dialog

Create:

```text
components/files/rename-node-dialog.tsx
```

Requirements:

* use `AppDialog`
* prefill the current name
* auto-focus the input
* select the filename stem when practical
* preserve the extension when only the stem is selected
* submit on Enter
* disable unchanged submissions
* show sibling-name conflicts clearly
* close on success

Do not silently overwrite an existing sibling.

---

# Delete Node Dialog

Create:

```text
components/files/delete-node-dialog.tsx
```

Requirements:

* use destructive styling
* identify the selected node
* explain recursive deletion for folders
* use no text input
* show pending state
* reject deletion when protected descendants exist
* close on success

Suggested folder warning:

```text
This folder and all files inside it will be removed from the active workspace.
```

Do not use `window.confirm()`.

---

# Move Node Dialog

Create:

```text
components/files/move-node-dialog.tsx
```

A simple destination picker is sufficient.

Requirements:

* list valid destination folders
* include project root
* exclude the current parent when no move would occur
* exclude the node itself
* exclude descendants for folder moves
* disable invalid destinations
* show pending state
* close on success

Drag-and-drop moving is optional and not required.

---

# File Dialog Controller

Create a scoped controller for file dialogs.

Suggested location:

```text
hooks/use-file-dialogs.ts
```

Suggested state:

```ts
type FileDialogState =
  | {
      type: "create-file";
      parentId: string | null;
    }
  | {
      type: "create-folder";
      parentId: string | null;
    }
  | {
      type: "rename";
      node: ProjectNodeListItem;
    }
  | {
      type: "move";
      node: ProjectNodeListItem;
    }
  | {
      type: "delete";
      node: ProjectNodeListItem;
    }
  | null;
```

Do not place database logic inside the hook.

Use one shared dialog host within the project workspace.

---

# File Selection State

Create a lightweight file selection controller.

Suggested location:

```text
hooks/use-active-file.ts
```

For this feature, selecting a file may update the editor canvas placeholder with:

* file name
* language
* content preview
* message that Monaco integration is pending

Do not build a custom text editor.

The selected file ID should be the source of selection state.

Do not use file paths as the selection identity.

---

# Project Workspace Page

Update:

```text
app/(app)/editor/[projectId]/page.tsx
```

The page must:

1. authenticate the user
2. verify project access
3. load project metadata
4. load the active project tree
5. pass serializable data into the workspace UI
6. preserve the editor shell

Suggested project workspace composition:

```text
EditorShell
  ProjectWorkspace
    FileExplorer
    EditorCanvasPlaceholder
```

Do not query Prisma directly from Client Components.

---

# Empty File-System State

When a project has no active nodes, display:

```text
No files yet
```

```text
Create a file or folder to begin building this project.
```

Provide a restrained create action for users with write access.

Viewers should see the empty state without mutation controls.

Do not use illustrations or large cards.

---

# Loading States

Provide loading feedback for:

* initial project tree
* opening file content
* create mutation
* rename mutation
* move mutation
* delete mutation

Use:

* tree skeletons
* stable explorer dimensions
* button pending labels
* disabled duplicate actions

Avoid full-page spinners.

Do not collapse the explorer while data loads.

---

# Error States

## Tree Loading Failure

Keep the workspace shell visible.

Show a concise error in the explorer region.

Do not display raw database errors.

## File Loading Failure

Keep the tree available.

Show a recoverable editor-canvas error.

## Mutation Failure

Keep the relevant dialog open.

Preserve valid input.

Display a concise domain-specific message.

Examples:

* A file with this name already exists.
* The selected destination is invalid.
* This folder cannot be moved into itself.
* This protected file cannot be deleted.
* You do not have permission to modify this project.

---

# Revalidation

After structural mutations, revalidate:

```text
/editor/{projectId}
```

Operations requiring tree revalidation:

* create file
* create folder
* rename node
* move node
* delete node

Content-only updates should avoid rebuilding the full tree when the name and hierarchy do not change.

Do not force a full browser reload.

---

# Activity Preparation

File-system mutations will eventually appear in the project activity timeline.

Structure service results so later features can record events such as:

* file created
* folder created
* node renamed
* node moved
* node deleted
* file updated

Do not implement the activity table or event emission yet.

Do not couple the file service directly to a nonexistent timeline system.

---

# Collaboration Preparation

Stable node IDs must later support:

* Liveblocks room or document identifiers
* collaborative file presence
* shared selections
* AI patch targets
* conflict resolution

Do not use file paths as collaboration room IDs.

Do not initialize Liveblocks in this feature.

---

# AI Engineer Preparation

The AI Engineer will later consume project file context.

File service boundaries should support future functions such as:

```ts
getProjectContext(projectId)
getFilesByIds(projectId, fileIds)
applyFilePatch(projectId, patch)
```

Do not implement AI access in this feature.

Do not allow AI systems to bypass normal file authorization or protection rules later.

---

# Security Constraints

* Every query requires authenticated project access.
* Every mutation requires authenticated project write access.
* Viewers cannot mutate files.
* Node IDs do not grant access.
* Parent IDs must be verified server-side.
* Nodes cannot move between projects.
* Files cannot become parents.
* Folders cannot store file content.
* Protected nodes cannot be renamed, moved, or deleted through normal actions.
* Folder deletion must not partially succeed.
* Client-provided roles must be ignored.
* Client-provided protection flags must be ignored.
* Raw Prisma errors must not reach users.
* File content size must be validated.
* Prisma must remain server-only.

---

# Performance Constraints

* Load the project tree in one efficient query.
* Do not include file content in tree-list queries.
* Fetch file content only when a file is opened.
* Avoid one query per tree node.
* Use indexed project and parent relationships.
* Reuse the shared Prisma Client.
* Avoid deeply nested Prisma includes.
* Keep client tree state serializable.
* Avoid rebuilding the entire tree unnecessarily.
* Do not introduce polling.
* Do not save content on every keystroke in this feature.

---

# Accessibility

The file explorer must support:

* keyboard navigation
* visible focus states
* accessible expand and collapse controls
* semantic buttons
* accessible action menus
* dialog titles and descriptions
* focus return after dialogs close
* clear selected-file indication
* pending and disabled states

Do not rely only on icon color to communicate:

* selected
* protected
* folder state
* destructive actions

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
    file-explorer.tsx

  files/
    create-node-dialog.tsx
    delete-node-dialog.tsx
    file-dialogs.tsx
    file-tree.tsx
    file-tree-item.tsx
    move-node-dialog.tsx
    rename-node-dialog.tsx

hooks/
  use-active-file.ts
  use-file-dialogs.ts

lib/
  files/
    build-file-tree.ts
    file.actions.ts
    file.constants.ts
    file-language.ts
    file.queries.ts
    file.schemas.ts
    file.service.ts
    file.types.ts

prisma/
  schema.prisma
  migrations/
    ..._add_project_file_system/
      migration.sql
```

Use equivalent repository conventions when they already exist.

Do not duplicate validation, permission, or tree-building logic.

---

# Migration

Create a descriptive migration such as:

```text
add_project_file_system
```

The migration must add:

* node table
* node enums
* project relationship
* user creator and updater relationships
* foreign keys
* uniqueness constraints
* indexes

Inspect the generated SQL.

Verify:

* parent self-relation behavior
* deletion restrictions
* project cascades
* creator restrictions
* updater nullification
* root-level name uniqueness behavior
* required indexes

Do not use schema push as the permanent production workflow.

---

# Implementation Sequence

1. Extend the Prisma schema with file-system models and enums.
2. Add User and Project relation fields.
3. Generate and inspect the migration.
4. Apply the development migration.
5. Add file constants and shared types.
6. Add file-name and content validation schemas.
7. Add language and MIME detection.
8. Add project file authorization helpers.
9. Add file-system query functions.
10. Add the file domain service.
11. Implement create-file behavior.
12. Implement create-folder behavior.
13. Implement rename behavior.
14. Implement move behavior and cycle prevention.
15. Implement recursive soft deletion.
16. Implement file-content updates.
17. Add thin Server Actions.
18. Extend project creation with starter nodes.
19. Add the flat-list tree builder.
20. Build the file explorer.
21. Build the recursive tree UI.
22. Add node action menus.
23. Add create, rename, move, and delete dialogs.
24. Add active-file placeholder behavior.
25. Add loading and error states.
26. Verify viewer restrictions.
27. Verify protected-node restrictions.
28. Run migration, lint, and production build checks.

---

# Check When Done

* `ProjectNode` exists in the Prisma schema.
* `NodeType` contains `FILE` and `FOLDER`.
* `NodeStatus` contains `ACTIVE` and `DELETED`.
* Every node belongs to one project.
* Root-level and nested nodes are supported.
* Parent nodes must be folders.
* Files cannot contain children.
* Folders do not store content.
* Active sibling names are unique.
* Root-level name collisions are handled correctly.
* File and folder names are validated.
* Stable node IDs are used instead of paths.
* File content is not included in tree-list queries.
* File content size is limited.
* Language detection works for supported extensions.
* Project creation creates initial files transactionally.
* Project creation does not leave partial starter structures.
* Owners can create, rename, move, edit, and delete nodes.
* Editors can create, rename, move, edit, and delete unprotected nodes.
* Viewers cannot mutate nodes.
* Protected nodes reject rename, move, and delete operations.
* Creating a file validates its parent.
* Creating a folder validates its parent.
* Renaming rejects sibling conflicts.
* Moving rejects sibling conflicts.
* Moving a folder into itself is rejected.
* Moving a folder into a descendant is rejected.
* Nodes cannot move between projects.
* File deletion uses soft deletion.
* Folder deletion soft-deletes all descendants transactionally.
* Folders containing protected descendants cannot be deleted.
* Deleted nodes do not appear in normal tree queries.
* The file explorer renders the persistent project tree.
* Folders expand and collapse.
* Tree ordering is deterministic.
* Node action menus are keyboard accessible.
* Viewers do not see mutation actions.
* Create File dialog works.
* Create Folder dialog works.
* Rename dialog works.
* Move dialog shows valid destinations.
* Delete dialog uses destructive styling.
* Selecting a file uses its stable node ID.
* Project tree queries verify access server-side.
* File-content queries verify access server-side.
* Mutations verify write access server-side.
* No Prisma imports exist in Client Components.
* Raw Prisma errors are not displayed.
* The migration is generated, inspected, and committed.
* No generated `components/ui/*` files are modified.
* `npm run lint` passes.
* `npm run build` passes.

---

# Unlocks

* `07-monaco-editor.md`
* persistent editor models
* file opening and tab management
* file autosave
* real-time file collaboration
* Liveblocks document rooms
* AI Engineer project context
* AI patch targeting
* project snapshots
* WebContainer file mounting
* code execution
* activity timeline
* future file version history
