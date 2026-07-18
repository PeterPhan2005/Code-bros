"use client";

import { useCallback, useState } from "react";

import type { ProjectNodeListItem } from "@/lib/files/file.types";

export type FileDialogState =
  | { type: "create-file"; parentId: string | null }
  | { type: "create-folder"; parentId: string | null }
  | { type: "rename"; node: ProjectNodeListItem }
  | { type: "move"; node: ProjectNodeListItem }
  | { type: "delete"; node: ProjectNodeListItem }
  | null;

export function useFileDialogs() {
  const [dialog, setDialog] = useState<FileDialogState>(null);

  const openCreateFile = useCallback((parentId: string | null) => {
    setDialog({ type: "create-file", parentId });
  }, []);

  const openCreateFolder = useCallback((parentId: string | null) => {
    setDialog({ type: "create-folder", parentId });
  }, []);

  const openRename = useCallback((node: ProjectNodeListItem) => {
    setDialog({ type: "rename", node });
  }, []);

  const openMove = useCallback((node: ProjectNodeListItem) => {
    setDialog({ type: "move", node });
  }, []);

  const openDelete = useCallback((node: ProjectNodeListItem) => {
    setDialog({ type: "delete", node });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  return {
    dialog,
    openCreateFile,
    openCreateFolder,
    openRename,
    openMove,
    openDelete,
    closeDialog,
  };
}

export type FileDialogController = ReturnType<typeof useFileDialogs>;
