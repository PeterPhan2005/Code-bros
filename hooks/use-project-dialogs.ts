"use client";

import { useCallback, useState } from "react";

import type { ProjectListItem } from "@/lib/projects/project.types";

export type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: ProjectListItem }
  | { type: "delete"; project: ProjectListItem }
  | null;

export function useProjectDialogController() {
  const [dialog, setDialog] = useState<ProjectDialogState>(null);

  const openCreate = useCallback(() => {
    setDialog({ type: "create" });
  }, []);

  const openRename = useCallback((project: ProjectListItem) => {
    setDialog({ type: "rename", project });
  }, []);

  const openDelete = useCallback((project: ProjectListItem) => {
    setDialog({ type: "delete", project });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  return {
    dialog,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
  };
}

export type ProjectDialogController = ReturnType<
  typeof useProjectDialogController
>;
