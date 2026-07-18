# 05-projects.md

> Read `AGENTS.md` before starting.

# Feature 05 — Projects

## Objective

Implement persistent project management for Code Bros.

This feature builds the `/editor` home experience and connects the editor shell to the PostgreSQL database established in `04-database.md`.

Users must be able to:

* create projects
* view owned projects
* view shared projects
* open projects
* rename owned projects
* soft-delete owned projects

All project operations must use authenticated server-side identity and enforce ownership or membership permissions.

Do not use mock project data.

---

## Dependencies

* `01-design-system.md`
* `02-editor.md`
* `03-auth.md`
* `04-database.md`

---

# Project Principles

## Projects Are Persistent Workspaces

A project is the durable container for future:

* files
* folders
* collaboration sessions
* AI activity
* snapshots
* execution history
* project settings
* member permissions

Project state must be persisted in PostgreSQL.

Do not store projects only in:

* React state
* browser storage
* Clerk metadata
* Liveblocks storage
* hardcoded arrays

## Server Owns Project Mutations

All project mutations must run on the server.

The browser may request an operation, but it must not decide:

* who owns a project
* whether a user may rename it
* whether a user may delete it
* which role a user has
* whether a slug is available

## Ownership Is Verified

Only the canonical project owner may:

* rename the project
* delete the project
* access owner-only project actions

Do not infer ownership from:

* which sidebar tab displays the project
* client-provided role values
* hidden UI controls
* URL parameters
* cached browser state

## Shared Projects Are Read Through Membership

A shared project is a project where:

* the current user is a `ProjectMember`
* the current user is not the canonical owner
* the membership grants access

Shared projects must not expose owner-only actions.

---

# Scope

Implement:

* `/editor` project home
* authenticated project queries
* owned project list
* shared project list
* create project dialog
* rename project dialog
* delete project dialog
* project sidebar integration
* project item actions
* slug generation and collision handling
* project navigation
* pending and error states
* mobile sidebar backdrop
* soft deletion

Do not implement:

* project files
* Monaco models
* folder trees
* collaboration rooms
* project invitations
* member management
* ownership transfer
* project templates
* public projects
* project duplication
* archive UI
* snapshots
* execution
* AI activity
* activity timeline

---

# Route Structure

Use the authenticated application route group introduced by the auth feature when available.

Expected structure:

```text
app/
  (app)/
    editor/
      page.tsx

      [projectId]/
        page.tsx
```

The exact project route identifier may use a project ID or an owner-scoped slug.

For the initial implementation, prefer:

```text
/editor/[projectId]
```

Project IDs are stable and avoid coupling project access to renameable names.

A later routing feature may introduce human-readable owner and slug routes.

Do not treat possession of a project ID as authorization.

Every project route must verify access server-side.

---

# Editor Home

Update:

```text
app/(app)/editor/page.tsx
```

Reuse the existing `EditorShell`.

Do not rebuild the navbar or sidebar.

The editor home should present a minimal empty-workspace state in the center of the editor canvas.

## Content

Heading:

```text
Create a project or open an existing one
```

Description:

```text
Start a collaborative coding workspace, invite teammates, and work with Code Bro in real time.
```

Primary action:

```text
New Project
```

Use the `Plus` icon from `lucide-react`.

## Layout Rules

* Center the content within the available editor canvas.
* Keep the content visually restrained.
* Do not wrap the content in a card.
* Do not add illustrations.
* Do not use gradients.
* Do not create an oversized hero section.
* Do not add fake recent projects to the canvas.
* Keep the editor as the conceptual center of the product.

Clicking `New Project` must open the Create Project dialog.

---

# Project Queries

Create server-only project query functions.

Suggested location:

```text
lib/projects/project.queries.ts
```

Implement:

```ts
getOwnedProjects()
getSharedProjects()
getAccessibleProjectById(projectId: string)
```

All query functions must:

1. resolve the authenticated application user
2. reject unauthenticated access
3. exclude projects with `status = DELETED`
4. return only fields required by the UI
5. use deterministic ordering

## Owned Projects

Return projects where:

```text
project.ownerId === currentUser.id
```

Order by:

```text
updatedAt descending
```

## Shared Projects

Return projects where:

* a matching `ProjectMember` exists
* `ProjectMember.userId` equals the current application user ID
* the project owner is not the current user
* the project is not deleted

Include the current user’s project role.

Order by:

```text
updatedAt descending
```

## Accessible Project

A project is accessible when the current user is:

* the canonical owner
* or an active project member

The query must return `null` or a domain-safe not-found result when access is unavailable.

Do not reveal whether an inaccessible project exists.

---

# Project Data Shape

Create shared project types.

Suggested location:

```text
lib/projects/project.types.ts
```

Use a minimal UI-safe shape such as:

```ts
interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  updatedAt: Date;
  ownership: "owned" | "shared";
  role: "OWNER" | "EDITOR" | "VIEWER";
}
```

Do not send complete database records to Client Components when unnecessary.

Do not expose internal relational data that the UI does not need.

---

# Project Validation

Install or use the repository’s existing schema validation library.

Prefer:

```text
zod
```

Create project validation schemas.

Suggested location:

```text
lib/projects/project.schemas.ts
```

Implement schemas for:

* create project
* rename project
* delete project identifier

## Project Name Rules

A project name must:

* be a string
* be trimmed
* contain at least 1 visible character
* contain no more than 80 characters

Reject names that become empty after trimming.

Do not silently persist leading or trailing whitespace.

## Project ID Rules

Project IDs must be validated as non-empty strings before database access.

Do not assume route or form values are valid.

---

# Slug Generation

Create a reusable server-side slug utility.

Suggested location:

```text
lib/projects/project-slug.ts
```

The base slug should:

* derive from the project name
* use lowercase characters
* replace spaces with hyphens
* remove unsupported URL characters
* collapse repeated separators
* remove leading and trailing separators
* provide a fallback when no valid characters remain

Example:

```text
Realtime Code Review
```

becomes:

```text
realtime-code-review
```

## Slug Uniqueness

Project slugs are unique within the owner’s namespace.

When the base slug already exists, append a numeric suffix.

Example:

```text
code-bros
code-bros-2
code-bros-3
```

Slug uniqueness must be resolved on the server.

The database compound unique constraint remains the final protection:

```text
@@unique([ownerId, slug])
```

Handle uniqueness conflicts safely in case concurrent requests generate the same candidate.

Do not trust the client-side slug preview as the final persisted slug.

---

# Project Mutations

Use Server Actions unless the repository has already standardized on Route Handlers for form mutations.

Suggested location:

```text
lib/projects/project.actions.ts
```

Implement:

```ts
createProject()
renameProject()
deleteProject()
```

Every mutation must:

1. resolve the authenticated user
2. validate input
3. verify authorization
4. perform the database operation
5. return a typed result
6. revalidate affected routes
7. avoid exposing raw database errors

---

# Mutation Result Pattern

Use a consistent result type.

Example:

```ts
type ActionResult<T = undefined> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };
```

The exact shape may vary, but all actions should return predictable results.

Do not throw raw Prisma errors into Client Components.

---

# Create Project

Implement project creation as a transaction.

The transaction must create:

1. the `Project`
2. the owner’s `ProjectMember` record with role `OWNER`

## Input

```ts
{
  name: string;
}
```

Do not accept from the client:

* `ownerId`
* `clerkUserId`
* `role`
* `status`
* `visibility`
* final trusted slug

These values are resolved or assigned by the server.

## Defaults

New projects must use:

```text
visibility = PRIVATE
status = ACTIVE
```

## Creation Flow

1. Resolve the authenticated application user.
2. Validate and normalize the name.
3. Generate a unique owner-scoped slug.
4. Create the project and owner membership atomically.
5. Revalidate the editor project list.
6. Return the created project ID.
7. Navigate the user to the created project.

Expected destination:

```text
/editor/{projectId}
```

Do not leave a successfully created project only in local UI state.

---

# Rename Project

Only the canonical project owner may rename a project.

## Input

```ts
{
  projectId: string;
  name: string;
}
```

## Behavior

* Validate the project ID.
* Validate and normalize the new name.
* Verify the current user owns the project.
* Reject deleted projects.
* Generate a new unique slug from the updated name.
* Update `name`, `slug`, and `updatedAt`.
* Revalidate relevant project routes and sidebar data.

Changing the project name should update its slug.

Because the initial editor route uses `projectId`, renaming must not invalidate the active route.

## No-Change Submission

When the normalized name is unchanged:

* return success without unnecessary mutation
* or disable submission in the dialog

Do not create needless database writes.

---

# Delete Project

Only the canonical project owner may delete a project.

Use soft deletion.

## Input

```ts
{
  projectId: string;
}
```

## Behavior

Update the project atomically:

```text
status = DELETED
deletedAt = current timestamp
```

Do not hard-delete the project in this feature.

After deletion:

* remove it from owned-project queries
* prevent normal project access
* revalidate `/editor`
* close the delete dialog
* redirect to `/editor` when deleting the currently open project

Do not expose a delete action for shared projects.

---

# Project Service

Place domain operations in a server-only service module.

Suggested location:

```text
lib/projects/project.service.ts
```

The service should own:

* project creation
* slug collision handling
* rename logic
* soft deletion
* ownership checks
* access checks

Server Actions should remain thin.

They should:

* parse input
* call domain services
* translate domain failures into action results
* revalidate routes

Do not place all domain logic directly inside React components or action files.

---

# Project Authorization Helpers

Create reusable server-only authorization helpers.

Suggested location:

```text
lib/projects/project-access.ts
```

Possible functions:

```ts
requireProjectOwner(projectId: string)
requireProjectAccess(projectId: string)
getProjectAccess(projectId: string)
```

## Owner Check

The current user is the owner only when:

```text
project.ownerId === currentUser.id
```

An `OWNER` membership row alone must not override the canonical owner relationship.

## Access Check

A user has project access when:

* they own the project
* or they have a matching membership

Deleted projects must fail normal access checks.

Do not distinguish “not found” from “not authorized” in user-facing responses.

---

# Project Sidebar

Update:

```text
components/editor/project-sidebar.tsx
```

Replace placeholder project states with real project data.

The sidebar must render:

* owned projects under `My Projects`
* membership projects under `Shared`

## Component Boundaries

Prefer loading project data in a Server Component and passing serializable data into the interactive sidebar.

Do not import Prisma into the sidebar component.

Do not fetch project data separately for every project row.

## Project Items

Each project item should display:

* project name
* active state when currently open
* concise last-updated information when useful
* role indicator for shared projects when useful

Clicking a project item navigates to:

```text
/editor/{projectId}
```

## Owned Project Actions

Owned project items must provide:

* Rename
* Delete

Use a compact action menu with shadcn `DropdownMenu`.

Use Lucide icons.

Recommended icons:

* `Pencil`
* `Trash2`
* `MoreHorizontal`

Actions should remain accessible by keyboard.

## Shared Project Actions

Shared project items must not expose:

* Rename
* Delete

Do not merely disable these actions.

Do not render owner-only actions for shared projects.

## Empty States

### My Projects

Show an empty state when the user owns no active projects.

Suggested text:

```text
No projects yet
```

```text
Create your first collaborative workspace.
```

### Shared

Show an empty state when the user has no shared projects.

Suggested text:

```text
No shared projects
```

```text
Projects shared with you will appear here.
```

---

# Project Item Menu Behavior

Opening a project action menu must not trigger project navigation.

Use event handling that prevents the project row click from firing when interacting with:

* menu trigger
* rename action
* delete action

Do not create inaccessible nested interactive elements.

Prefer a row structure where navigation and actions are separate controls.

---

# Mobile Sidebar Behavior

On narrow screens, the project sidebar must:

* continue floating above the editor
* include a backdrop scrim
* close when the user taps the backdrop
* close after selecting a project
* close when the close button is activated
* remain keyboard accessible
* avoid pushing editor content

The scrim should:

* cover the editor canvas below the navbar
* use semantic overlay styling
* not cover the sidebar itself
* use an appropriate z-index
* support a restrained fade transition
* respect reduced-motion preferences

Do not add the scrim on desktop when it is not needed.

---

# Project Dialog Controller

Create a dedicated hook to manage project dialog state.

Suggested location:

```text
hooks/use-project-dialogs.ts
```

The hook should manage which project dialog is open.

Suggested state:

```ts
type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: ProjectListItem }
  | { type: "delete"; project: ProjectListItem }
  | null;
```

Expose actions such as:

```ts
openCreate()
openRename(project)
openDelete(project)
closeDialog()
```

The hook may manage selected-project state.

Form field state should remain inside the relevant form unless shared state is necessary.

Do not place database operations inside the hook.

---

# Create Project Dialog

Create:

```text
components/projects/create-project-dialog.tsx
```

Use the shared `AppDialog` pattern.

## Fields

Include:

* project name input
* live slug preview

## Name Input

Requirements:

* label: `Project name`
* auto-focus when the dialog opens
* maximum length aligned with validation
* display field validation errors
* submit on Enter when valid
* preserve accessible labeling

## Slug Preview

The preview should update as the user types.

Example:

```text
Project URL
/editor/realtime-code-review
```

The preview is informational.

The final server-generated slug may differ because of:

* collisions
* normalization
* concurrency

Communicate this subtly when appropriate.

Do not allow the user to edit the slug in this feature.

## Submit Behavior

The primary action should:

* show a pending state
* disable duplicate submissions
* call the create-project Server Action
* display validation or domain errors
* navigate to the new project after success
* close only after successful completion

Suggested button label:

```text
Create Project
```

---

# Rename Project Dialog

Create:

```text
components/projects/rename-project-dialog.tsx
```

Use the shared `AppDialog` pattern.

## Requirements

* prefill the current project name
* show the current project name in the description
* auto-focus the input
* select the current name when practical
* update the slug preview as the value changes
* submit on Enter
* prevent duplicate submission
* show validation errors
* close after success

Suggested title:

```text
Rename project
```

Suggested description:

```text
Choose a new name for "{currentProjectName}".
```

Suggested submit label:

```text
Save Changes
```

Disable submission when the normalized value is unchanged.

---

# Delete Project Dialog

Create:

```text
components/projects/delete-project-dialog.tsx
```

Use the shared `AppDialog` pattern.

This is a destructive confirmation dialog.

## Requirements

* no text input
* clearly identify the project being deleted
* explain that the project will be removed from normal access
* use destructive button styling
* preserve a cancel action
* prevent duplicate submission
* show a pending state
* close after success

Suggested title:

```text
Delete project
```

Suggested description:

```text
"{projectName}" will be removed from your active projects. This action cannot be undone from the current interface.
```

Suggested destructive action:

```text
Delete Project
```

Do not use browser-native `confirm()`.

Do not require users to type the project name in this feature.

---

# Dialog Composition

Create a project dialog host component.

Suggested location:

```text
components/projects/project-dialogs.tsx
```

The host should render the active dialog based on the project dialog controller.

This avoids placing all dialog implementations directly inside the sidebar.

The same controller must support opening Create Project from:

* editor home
* sidebar bottom action

The same controller must support opening Rename or Delete from project item actions.

Do not create separate disconnected dialog state for each trigger.

---

# Shared Project Provider

Because project dialogs can be opened from both the editor canvas and sidebar, provide shared state at the editor shell level.

Use either:

* a focused React context
* a provider scoped to the editor shell
* another simple shared composition pattern

Suggested files:

```text
components/projects/project-dialog-provider.tsx
hooks/use-project-dialogs.ts
```

Do not add a global state library solely for these dialogs.

Do not expose project dialog state outside the authenticated editor workspace.

---

# Editor Shell Integration

Update the editor shell so project state and dialog triggers are available to:

* navbar-adjacent editor layout
* sidebar
* editor home
* future project workspace screens

The shell should compose:

```text
ProjectDialogProvider
EditorNavbar
ProjectSidebar
ProjectDialogs
Editor canvas
```

Do not change the existing sidebar overlay behavior.

Do not make project dialogs responsible for rendering the entire editor shell.

---

# Project Page

Create:

```text
app/(app)/editor/[projectId]/page.tsx
```

This page establishes the protected project workspace route.

## Server Behavior

Before rendering:

1. resolve the authenticated user
2. validate `projectId`
3. load the accessible project
4. reject deleted projects
5. return a not-found response when access is unavailable

Do not render project content before access is verified.

## Initial Content

This feature does not implement the code editor yet.

Render a minimal project workspace placeholder containing:

* project name
* current user role when useful
* a restrained message that the workspace is ready for future editor integration

Do not create a card-heavy dashboard.

The editor shell and sidebar should remain visible.

---

# Loading States

Provide loading feedback for:

* project list loading when route streaming is used
* create submission
* rename submission
* delete submission
* project route loading

Use:

* stable skeletons for project lists
* button pending labels for mutations
* disabled controls during active submissions

Avoid full-page spinners.

Do not remove existing project data while a mutation is pending unless the final result is known.

---

# Empty and Error States

## Project Query Failure

When project lists cannot load:

* keep the editor shell usable
* show a concise recoverable message
* do not display raw database errors
* provide a retry path when practical

## Inaccessible Project

Return a not-found experience.

Do not reveal:

* whether the project exists
* who owns it
* which members can access it

## Mutation Failure

Keep the dialog open.

Display a concise error message near the relevant form or action area.

Do not clear valid user input after a failed request.

---

# Revalidation

After project creation:

* revalidate `/editor`
* revalidate project sidebar data
* navigate to the created project

After rename:

* revalidate `/editor`
* revalidate the active project route
* update sidebar project data

After deletion:

* revalidate `/editor`
* remove the project from sidebar data
* redirect away when the deleted project is open

Use targeted route or cache revalidation.

Do not force a full browser reload.

---

# Accessibility

Project interfaces must support:

* keyboard navigation
* visible focus states
* semantic form labels
* accessible dialog titles and descriptions
* accessible icon-only buttons
* focus return after dialog close
* Escape to close dialogs when safe
* disabled and pending state announcement
* destructive-action clarity

Project action menus must remain keyboard operable.

Do not remove Radix accessibility behavior.

---

# Security Constraints

* All project operations require authentication.
* Project ownership must be checked server-side.
* Shared membership must be checked server-side.
* Client-provided owner IDs must be ignored.
* Client-provided roles must be ignored.
* Deleted projects must fail normal access checks.
* Shared project users must not rename projects.
* Shared project users must not delete projects.
* Project IDs must not be treated as authorization.
* Raw Prisma errors must not reach the client.
* Server Actions must validate all input.
* Project queries must return only required data.
* UI visibility must not replace authorization.

---

# Performance Constraints

* Load owned and shared projects efficiently.
* Avoid one database query per project item.
* Select only sidebar-required fields.
* Index-backed queries from `04-database.md` must be used.
* Do not fetch all project members for sidebar lists.
* Avoid duplicate project-list requests within the same render.
* Do not introduce a client-side polling loop.
* Keep interactive client boundaries narrow.
* Use Server Components for initial project loading where practical.

---

# File Structure

Expected structure:

```text
app/
  (app)/
    editor/
      page.tsx

      [projectId]/
        page.tsx
        loading.tsx

components/
  editor/
    editor-shell.tsx
    project-sidebar.tsx

  projects/
    create-project-dialog.tsx
    delete-project-dialog.tsx
    project-dialog-provider.tsx
    project-dialogs.tsx
    project-list.tsx
    project-list-item.tsx
    rename-project-dialog.tsx

hooks/
  use-project-dialogs.ts

lib/
  projects/
    project-access.ts
    project.actions.ts
    project.queries.ts
    project.schemas.ts
    project.service.ts
    project-slug.ts
    project.types.ts
```

Use equivalent existing repository conventions when they already exist.

Do not duplicate project logic across multiple files.

---

# Implementation Sequence

1. Add project validation schemas.
2. Add the server-side slug utility.
3. Add authenticated project queries.
4. Add project authorization helpers.
5. Add the project domain service.
6. Add create, rename, and delete Server Actions.
7. Build the shared project dialog controller.
8. Build the Create Project dialog.
9. Build the Rename Project dialog.
10. Build the Delete Project dialog.
11. Replace sidebar placeholders with persistent project lists.
12. Add owned project action menus.
13. Add shared project role display.
14. Add mobile backdrop behavior.
15. Wire all New Project triggers.
16. Create the `/editor/[projectId]` route.
17. Add route-level project access verification.
18. Add pending, empty, and error states.
19. Add targeted revalidation and navigation.
20. Run lint and production build checks.

---

# Check When Done

* `/editor` renders inside the existing editor shell.
* The editor home contains the required heading, description, and New Project action.
* The editor home is not wrapped in a card.
* Owned projects load from PostgreSQL.
* Shared projects load through membership records.
* Deleted projects do not appear in normal lists.
* Project lists use authenticated server-side queries.
* No mock project data remains.
* Create Project opens from the editor home.
* Create Project opens from the sidebar.
* Project name validation works.
* Live slug preview updates while typing.
* The server remains authoritative for the final slug.
* Slug collisions produce unique owner-scoped slugs.
* Project creation creates the project and owner membership atomically.
* Successful creation navigates to `/editor/{projectId}`.
* Rename dialog is prefilled.
* Rename input auto-focuses.
* Enter submits the rename form.
* Rename requires canonical ownership.
* Rename updates the project slug safely.
* Delete dialog contains no text input.
* Delete uses destructive styling.
* Delete performs soft deletion.
* Delete requires canonical ownership.
* Deleting the active project redirects to `/editor`.
* Owned project items expose Rename and Delete.
* Shared project items expose no owner-only actions.
* Project action menus do not trigger accidental navigation.
* Mobile sidebar includes a backdrop scrim.
* Tapping the mobile scrim closes the sidebar.
* Selecting a project on mobile closes the sidebar.
* Project dialogs share one state controller.
* Pending states prevent duplicate submissions.
* Mutation failures keep dialogs open.
* Raw Prisma errors are not shown.
* Inaccessible projects return a not-found experience.
* Project routes verify access server-side.
* Project IDs are not treated as authorization.
* No Prisma imports exist in Client Components.
* No generated `components/ui/*` files are modified.
* `npm run lint` passes.
* `npm run build` passes.

---

# Unlocks

* `06-file-system.md`
* project file persistence
* folder trees
* Monaco project models
* Liveblocks room authorization
* collaborator invitations
* project membership management
* role-based workspace permissions
* AI Engineer project context
* project snapshots
* execution sessions
* activity timelines
