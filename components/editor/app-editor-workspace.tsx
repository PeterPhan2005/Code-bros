import type { ReactNode } from "react";

import { EditorShell } from "@/components/editor/editor-shell";
import { getProjectLists } from "@/lib/projects/project.queries";
import type { ProjectListItem } from "@/lib/projects/project.types";

interface AppEditorWorkspaceProps {
  children: ReactNode;
  currentProjectId?: string;
}

export async function AppEditorWorkspace({
  children,
  currentProjectId,
}: AppEditorWorkspaceProps) {
  let ownedProjects: ProjectListItem[] = [];
  let sharedProjects: ProjectListItem[] = [];
  let projectsError = false;

  try {
    const projectLists = await getProjectLists();
    ownedProjects = projectLists.ownedProjects;
    sharedProjects = projectLists.sharedProjects;
  } catch {
    projectsError = true;
  }

  return (
    <EditorShell
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      currentProjectId={currentProjectId}
      projectsError={projectsError}
    >
      {children}
    </EditorShell>
  );
}
