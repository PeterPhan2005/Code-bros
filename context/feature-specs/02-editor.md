# 02-editor.md

> Read `AGENTS.md` before starting.

# Feature 02 — Editor Shell

## Objective

Create the foundational interface that frames every Code Bros editor screen.

This feature establishes the reusable editor navbar, floating project sidebar, and shared dialog composition pattern. It does not implement the Monaco code editor, file explorer, collaboration, project creation, or functional dialogs.

The editor shell must remain lightweight and extensible because all future workspace features will be composed inside it.

---

## Dependencies

* `01-design-system.md`

---

## Scope

Implement:

* Editor navbar
* Floating project sidebar
* Sidebar open and close behavior
* Project tabs
* Empty project states
* New Project action placeholder
* Reusable dialog composition pattern

Do not implement:

* Monaco Editor
* Project persistence
* Project creation workflow
* Authentication
* File explorer
* Shared project loading
* Dialog business logic
* Editor collaboration

---

# Editor Navbar

Create:

```text
components/editor/editor-navbar.tsx
```

The navbar is the persistent top-level control surface for the editor workspace.

## Requirements

* Use a fixed height.
* Span the full width of the editor viewport.
* Use the existing dark background token from `globals.css`.
* Add a subtle bottom border using the existing border token.
* Divide the navbar into three sections:

  * left
  * center
  * right
* Keep the center section available for future project and workspace controls.
* Keep the right section empty for now.
* Do not hardcode colors that already exist as semantic design tokens.

## Left Section

The left section must contain a sidebar toggle button.

Use:

* `PanelLeftOpen` when the sidebar is closed
* `PanelLeftClose` when the sidebar is open

Import both icons from:

```text
lucide-react
```

The button must:

* use the shared shadcn `Button` primitive
* use an icon-sized variant
* have an accessible label
* expose its state through `aria-expanded`
* preserve a visible keyboard focus state
* call the provided toggle handler

## Component API

The navbar should accept:

```ts
interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}
```

The navbar must not own sidebar state.

The parent editor layout remains the source of truth.

## Layout Rules

* Left and right sections should reserve stable horizontal space.
* The center section should grow to fill the remaining width.
* Controls must remain vertically centered.
* Opening the sidebar must not move or resize the navbar.
* Avoid absolute positioning unless required for stable center alignment.

---

# Project Sidebar

Create:

```text
components/editor/project-sidebar.tsx
```

The project sidebar provides access to the user's own projects and projects shared by collaborators.

It must behave as an overlay above the editor canvas.

## Component API

The sidebar must accept:

```ts
interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

The sidebar must not own its open state.

## Positioning

The sidebar must:

* appear below the editor navbar
* anchor to the left side of the viewport
* float above the editor canvas
* not push, resize, or reflow editor content
* use a fixed or absolute overlay position
* occupy the available vertical space beneath the navbar
* use a consistent width suitable for project navigation
* remain above the editor through an intentional z-index

Do not implement it as a permanent grid column.

## Motion

The sidebar must:

* slide in from the left when opened
* slide out toward the left when closed
* use a short, restrained transition
* respect reduced-motion preferences
* remain mounted when practical so transitions are smooth

Do not use exaggerated spring animations.

## Surface Styling

Use the existing semantic tokens from `globals.css`.

The sidebar should include:

* dark background
* subtle right border
* restrained elevation when needed
* no gradients
* no glassmorphism
* no decorative background effects

---

# Sidebar Header

The header must contain:

* `Projects` title
* close button

The close button must:

* use the shadcn `Button` primitive
* use the `X` icon from `lucide-react`
* have an accessible label
* call `onClose`
* preserve a visible keyboard focus state

The header should remain visually distinct from the sidebar content through spacing or a subtle bottom border.

---

# Project Tabs

Use the existing shadcn `Tabs` primitive.

Create two tabs:

* My Projects
* Shared

The tabs should fill the available sidebar width.

Use stable values:

```text
my-projects
shared
```

The default active tab should be:

```text
my-projects
```

Do not create a custom tab implementation.

---

# Empty Project States

Both tabs must display an empty placeholder state.

## My Projects

Communicate that the user has not created any projects yet.

The state may include:

* concise title
* brief supporting text

Do not add another primary action inside the empty state because the permanent `New Project` button already exists at the bottom of the sidebar.

## Shared

Communicate that no projects have been shared with the user.

The state may include:

* concise title
* brief supporting text

## Empty-State Rules

Empty states must:

* remain visually quiet
* use muted semantic text tokens
* avoid illustrations
* avoid decorative gradients
* avoid fake project data
* avoid implementing loading behavior
* remain centered within the available content region

---

# Sidebar Content Layout

The sidebar should use a vertical structure:

```text
Header
Tabs
Scrollable content
Bottom action
```

Use the shadcn `ScrollArea` primitive for the project content region.

The bottom action must remain visible while project content scrolls.

---

# New Project Button

Add a full-width button at the bottom of the sidebar.

Requirements:

* label: `New Project`
* icon: `Plus`
* icon source: `lucide-react`
* use the shared shadcn `Button` primitive
* span the available sidebar width

This feature does not implement project creation.

The component may accept an optional callback for future integration:

```ts
onNewProject?: () => void;
```

When no callback is provided, the button must not cause an error.

Do not create a modal or project form in this feature.

---

# Editor Shell Composition

Create:

```text
components/editor/editor-shell.tsx
```

The shell should compose:

* `EditorNavbar`
* `ProjectSidebar`
* editor canvas region

The editor canvas may contain a minimal placeholder for now.

The shell should own the temporary sidebar state unless a higher-level page already owns it.

## Requirements

* Navbar remains fixed at the top of the shell.
* Sidebar renders above the editor canvas.
* Sidebar opening does not change canvas dimensions.
* Editor content fills the remaining viewport area.
* The shell does not contain project-specific business logic.
* The shell should accept children for future editor content.

Suggested API:

```ts
interface EditorShellProps {
  children: React.ReactNode;
}
```

---

# Dialog Pattern

Prepare a reusable composition pattern using the existing shadcn `Dialog` primitives.

Do not build functional application dialogs yet.

Create:

```text
components/shared/app-dialog.tsx
```

The pattern must support:

* title
* description
* body content
* footer actions
* controlled open state
* close behavior

## Suggested API

```ts
interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}
```

## Dialog Rules

* Use the existing semantic color tokens from `globals.css`.
* Do not hardcode light backgrounds.
* Preserve the accessibility behavior provided by Radix and shadcn.
* Keep title, description, content, and footer visually distinct.
* Footer actions should align consistently.
* Do not nest dialogs.
* Do not implement project creation or confirmation logic.
* Do not modify generated files inside `components/ui/*`.

---

# File Structure

Expected structure:

```text
components/
  editor/
    editor-navbar.tsx
    editor-shell.tsx
    project-sidebar.tsx

  shared/
    app-dialog.tsx
```

Use existing primitives from:

```text
components/ui/
```

Do not duplicate shadcn components.

---

# State Ownership

State should follow these rules:

* `EditorShell` may own temporary sidebar state.
* `EditorNavbar` receives sidebar state and toggle callbacks.
* `ProjectSidebar` receives open state and close callbacks.
* `AppDialog` uses controlled open state.
* Presentational components must not contain project data-fetching logic.

---

# Accessibility

All interactive controls must support:

* keyboard navigation
* visible focus indicators
* accessible labels
* semantic buttons
* appropriate ARIA state attributes

The sidebar toggle must expose:

```text
aria-expanded
```

Icon-only buttons must include accessible labels.

Do not remove accessibility attributes supplied by shadcn or Radix.

---

# Responsive Behavior

The sidebar remains an overlay at all supported viewport widths.

It must never become a layout column that pushes the editor canvas.

On narrow screens:

* the sidebar may occupy most of the viewport width
* it must retain a reasonable outer margin
* controls must remain reachable
* content must not overflow horizontally

Do not build a separate mobile navigation system in this feature.

---

# Styling Constraints

* Use existing semantic tokens from `globals.css`.
* Do not introduce default light styling.
* Do not hardcode reusable color values.
* Do not use gradients.
* Do not use glassmorphism.
* Do not create decorative illustrations.
* Do not edit generated `components/ui/*` files.
* Use `cn()` from `lib/utils.ts` for conditional classes.
* Use Lucide as the only icon library.

---

# Check When Done

* `EditorNavbar` renders without errors.
* Sidebar toggle displays the correct open or close icon.
* Sidebar state is controlled by its parent.
* Project sidebar slides in from the left.
* Opening the sidebar does not push editor content.
* Sidebar appears above the editor canvas.
* Sidebar header contains the title and close action.
* My Projects and Shared tabs switch correctly.
* Both tabs display appropriate empty states.
* Project content uses a scrollable region.
* New Project button remains visible at the bottom.
* Dialog pattern supports title, description, body, and footer actions.
* Existing dark theme tokens are used.
* No default light styling appears.
* Generated `components/ui/*` files remain unchanged.
* All new components compile without TypeScript errors.
* No lint errors are introduced.

---

# Unlocks

* Monaco editor integration
* Project creation dialog
* Project navigation
* File explorer
* Editor workspace layout
* Collaboration presence controls
* AI Engineer panel
* Shared project views
