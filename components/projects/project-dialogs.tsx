"use client";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { useProjectDialogs } from "@/components/projects/project-dialog-provider";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";

interface ProjectDialogsProps {
  currentProjectId?: string;
}

export function ProjectDialogs({
  currentProjectId,
}: ProjectDialogsProps) {
  const { dialog, closeDialog } = useProjectDialogs();

  if (!dialog) {
    return null;
  }

  if (dialog.type === "create") {
    return <CreateProjectDialog onClose={closeDialog} />;
  }

  if (dialog.type === "rename") {
    return (
      <RenameProjectDialog
        project={dialog.project}
        onClose={closeDialog}
      />
    );
  }

  return (
    <DeleteProjectDialog
      project={dialog.project}
      currentProjectId={currentProjectId}
      onClose={closeDialog}
    />
  );
}
