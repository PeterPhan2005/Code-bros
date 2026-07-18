import { notFound } from "next/navigation";

import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { Badge } from "@/components/ui/badge";
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

  return (
    <EditorWorkspace currentProjectId={project.id}>
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge variant="outline">
              {project.role === "OWNER"
                ? "Owner"
                : project.role === "EDITOR"
                  ? "Editor"
                  : "Viewer"}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This project workspace is ready for file and editor integration.
          </p>
        </div>
      </div>
    </EditorWorkspace>
  );
}
