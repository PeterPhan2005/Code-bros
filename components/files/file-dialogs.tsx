"use client";

import { CreateNodeDialog } from "@/components/files/create-node-dialog";
import { DeleteNodeDialog } from "@/components/files/delete-node-dialog";
import { MoveNodeDialog } from "@/components/files/move-node-dialog";
import { RenameNodeDialog } from "@/components/files/rename-node-dialog";
import type { FileDialogController } from "@/hooks/use-file-dialogs";
import { getProjectDestinationPath } from "@/lib/files/build-file-tree";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

interface FileDialogsProps {
  controller: FileDialogController;
  projectId: string;
  nodes: ProjectNodeListItem[];
  onFileCreated: (node: ProjectNodeListItem) => void;
  onNodeDeleted: (nodeId: string) => void;
}

export function FileDialogs({
  controller,
  projectId,
  nodes,
  onFileCreated,
  onNodeDeleted,
}: FileDialogsProps) {
  const { dialog, closeDialog } = controller;

  if (!dialog) {
    return null;
  }

  if (
    dialog.type === "create-file" ||
    dialog.type === "create-folder"
  ) {
    return (
      <CreateNodeDialog
        open
        type={dialog.type === "create-file" ? "file" : "folder"}
        projectId={projectId}
        parentId={dialog.parentId}
        destinationPath={getProjectDestinationPath(
          nodes,
          dialog.parentId,
        )}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
        onCreated={
          dialog.type === "create-file" ? onFileCreated : undefined
        }
      />
    );
  }

  if (dialog.type === "rename") {
    return (
      <RenameNodeDialog
        open
        node={dialog.node}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      />
    );
  }

  if (dialog.type === "move") {
    return (
      <MoveNodeDialog
        open
        node={dialog.node}
        nodes={nodes}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      />
    );
  }

  return (
    <DeleteNodeDialog
      open
      node={dialog.node}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
      onDeleted={onNodeDeleted}
    />
  );
}
