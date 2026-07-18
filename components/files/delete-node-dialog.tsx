"use client";

import { useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { deleteNodeAction } from "@/lib/files/file.actions";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

const DELETE_NODE_FORM_ID = "delete-project-node-form";

interface DeleteNodeDialogProps {
  open: boolean;
  node: ProjectNodeListItem;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (nodeId: string) => void;
}

export function DeleteNodeDialog({
  open,
  node,
  onOpenChange,
  onDeleted,
}: DeleteNodeDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      onOpenChange(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await deleteNodeAction({
        projectId: node.projectId,
        nodeId: node.id,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onDeleted?.(result.data.nodeId);
      onOpenChange(false);
    });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Delete ${node.type === "FILE" ? "file" : "folder"}`}
      description={`"${node.name}" will be removed from the active workspace.`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={DELETE_NODE_FORM_ID}
            variant="destructive"
            className="rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Deleting…" : `Delete ${node.type.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <form id={DELETE_NODE_FORM_ID} onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground">
          {node.type === "FOLDER"
            ? "This folder and all files inside it will be removed from the active workspace."
            : "The file will no longer appear in this project."}
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
