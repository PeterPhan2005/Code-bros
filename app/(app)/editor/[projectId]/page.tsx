import { notFound } from "next/navigation";

import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { ProjectWorkspace } from "@/components/editor/project-workspace";
import { getProjectTree } from "@/lib/files/file.queries";
import type { ProjectNodeListItem } from "@/lib/files/file.types";
import { getAccessibleProjectById } from "@/lib/projects/project.queries";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = await getAccessibleProjectById(projectId);

  if (!project) {
    notFound();
  }

  let nodes: ProjectNodeListItem[] = [];
  let treeError = false;

  try {
    nodes = await getProjectTree(project.id);
  } catch {
    treeError = true;
  }

  return (
    <EditorWorkspace currentProjectId={project.id}>
      <ProjectWorkspace
        project={project}
        nodes={nodes}
        treeError={treeError}
      />
    </EditorWorkspace>
  );
}
