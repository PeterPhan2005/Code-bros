import { EditorWorkspace } from "@/components/editor/editor-workspace";
import type { ProjectNodeListItem } from "@/lib/files/file.types";
import type { AccessibleProject } from "@/lib/projects/project.types";

interface ProjectWorkspaceProps {
  project: AccessibleProject;
  nodes: ProjectNodeListItem[];
  treeError?: boolean;
}

export function ProjectWorkspace({
  project,
  nodes,
  treeError = false,
}: ProjectWorkspaceProps) {
  return (
    <EditorWorkspace
      projectId={project.id}
      projectName={project.name}
      projectRole={project.role}
      initialTree={nodes}
      treeError={treeError}
    />
  );
}
