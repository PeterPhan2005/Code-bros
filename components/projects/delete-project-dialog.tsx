"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/projects/project.actions";
import type { ProjectListItem } from "@/lib/projects/project.types";

const DELETE_PROJECT_FORM_ID = "delete-project-form";

interface DeleteProjectDialogProps {
  project: ProjectListItem;
  currentProjectId?: string;
  onClose: () => void;
}

export function DeleteProjectDialog({
  project,
  currentProjectId,
  onClose,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) {
      onClose();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await deleteProject({ projectId: project.id });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onClose();

      if (currentProjectId === project.id) {
        router.replace("/editor");
      }
    });
  }

  return (
    <AppDialog
      open
      onOpenChange={handleOpenChange}
      title="Delete project"
      description={`"${project.name}" will be removed from your active projects. This action cannot be undone from the current interface.`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={DELETE_PROJECT_FORM_ID}
            variant="destructive"
            className="rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete Project"}
          </Button>
        </>
      }
    >
      <form id={DELETE_PROJECT_FORM_ID} onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground">
          Project access will be disabled for you and all collaborators.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
