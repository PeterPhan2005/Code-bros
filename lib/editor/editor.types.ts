import type { ProjectNodeListItem } from "@/lib/files/file.types";

export type EditorFileLoadStatus = "loading" | "loaded" | "error";
export type EditorSaveStatus =
  | "saved"
  | "dirty"
  | "saving"
  | "failed"
  | "conflict";

export interface OpenEditorFile {
  id: string;
  projectId: string;
  name: string;
  path: string;
  language: string;
  savedContent: string;
  currentContent: string;
  savedUpdatedAt: string;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  hasConflict: boolean;
  loadStatus: EditorFileLoadStatus;
  loadError: string | null;
}

export interface EditorTab {
  fileId: string;
  name: string;
  path: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export interface EditorWorkspaceState {
  openFileIds: string[];
  activeFileId: string | null;
  files: Record<string, OpenEditorFile>;
}

export interface EditorFileMetadata {
  node: ProjectNodeListItem;
  path: string;
}

export function getEditorSaveStatus(
  file: OpenEditorFile | null,
): EditorSaveStatus {
  if (!file) {
    return "saved";
  }

  if (file.hasConflict) {
    return "conflict";
  }

  if (file.isSaving) {
    return "saving";
  }

  if (file.saveError) {
    return "failed";
  }

  return file.isDirty ? "dirty" : "saved";
}
