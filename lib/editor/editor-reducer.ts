import type {
  EditorFileMetadata,
  EditorWorkspaceState,
  OpenEditorFile,
} from "@/lib/editor/editor.types";
import type { ProjectFileContent } from "@/lib/files/file.types";

export type EditorWorkspaceAction =
  | { type: "open-file"; metadata: EditorFileMetadata }
  | { type: "activate-file"; fileId: string }
  | { type: "retry-load"; fileId: string }
  | { type: "file-loaded"; file: ProjectFileContent }
  | { type: "file-load-failed"; fileId: string; error: string }
  | { type: "content-changed"; fileId: string; content: string }
  | { type: "save-started"; fileId: string }
  | {
      type: "save-succeeded";
      fileId: string;
      savedContent: string;
      updatedAt: string;
    }
  | {
      type: "save-failed";
      fileId: string;
      error: string;
      conflict: boolean;
    }
  | {
      type: "replace-with-server";
      fileId: string;
      file: ProjectFileContent;
    }
  | { type: "sync-metadata"; metadata: EditorFileMetadata[] }
  | { type: "close-file"; fileId: string }
  | { type: "close-files"; fileIds: string[] };

export const initialEditorWorkspaceState: EditorWorkspaceState = {
  openFileIds: [],
  activeFileId: null,
  files: {},
};

function updateFile(
  state: EditorWorkspaceState,
  fileId: string,
  updater: (file: OpenEditorFile) => OpenEditorFile,
) {
  const file = state.files[fileId];

  if (!file) {
    return state;
  }

  return {
    ...state,
    files: {
      ...state.files,
      [fileId]: updater(file),
    },
  };
}

function closeFiles(
  state: EditorWorkspaceState,
  requestedFileIds: string[],
) {
  const removedIds = new Set(requestedFileIds);
  const nextOpenFileIds = state.openFileIds.filter(
    (fileId) => !removedIds.has(fileId),
  );
  const nextFiles = { ...state.files };

  for (const fileId of removedIds) {
    delete nextFiles[fileId];
  }

  let nextActiveFileId = state.activeFileId;

  if (nextActiveFileId && removedIds.has(nextActiveFileId)) {
    const activeIndex = state.openFileIds.indexOf(nextActiveFileId);
    nextActiveFileId =
      state.openFileIds
        .slice(activeIndex + 1)
        .find((fileId) => !removedIds.has(fileId)) ??
      state.openFileIds
        .slice(0, activeIndex)
        .reverse()
        .find((fileId) => !removedIds.has(fileId)) ??
      null;
  }

  return {
    openFileIds: nextOpenFileIds,
    activeFileId: nextActiveFileId,
    files: nextFiles,
  };
}

export function editorWorkspaceReducer(
  state: EditorWorkspaceState,
  action: EditorWorkspaceAction,
): EditorWorkspaceState {
  switch (action.type) {
    case "open-file": {
      const { node, path } = action.metadata;
      const existingFile = state.files[node.id];

      if (existingFile) {
        return {
          ...state,
          activeFileId: node.id,
        };
      }

      return {
        ...state,
        openFileIds: [...state.openFileIds, node.id],
        activeFileId: node.id,
        files: {
          ...state.files,
          [node.id]: {
            id: node.id,
            projectId: node.projectId,
            name: node.name,
            path,
            language: node.language ?? "plaintext",
            savedContent: "",
            currentContent: "",
            savedUpdatedAt: node.updatedAt,
            isDirty: false,
            isSaving: false,
            saveError: null,
            hasConflict: false,
            loadStatus: "loading",
            loadError: null,
          },
        },
      };
    }

    case "activate-file":
      return state.files[action.fileId]
        ? { ...state, activeFileId: action.fileId }
        : state;

    case "retry-load":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        loadStatus: "loading",
        loadError: null,
      }));

    case "file-loaded":
      return updateFile(state, action.file.id, (file) => ({
        ...file,
        name: action.file.name,
        language: action.file.language,
        savedContent: action.file.content,
        currentContent: action.file.content,
        savedUpdatedAt: action.file.updatedAt,
        isDirty: false,
        isSaving: false,
        saveError: null,
        hasConflict: false,
        loadStatus: "loaded",
        loadError: null,
      }));

    case "file-load-failed":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        loadStatus: "error",
        loadError: action.error,
      }));

    case "content-changed":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        currentContent: action.content,
        isDirty: action.content !== file.savedContent,
        saveError: null,
        hasConflict: file.hasConflict,
      }));

    case "save-started":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        isSaving: true,
        saveError: null,
        hasConflict: false,
      }));

    case "save-succeeded":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        savedContent: action.savedContent,
        savedUpdatedAt: action.updatedAt,
        isDirty: file.currentContent !== action.savedContent,
        isSaving: false,
        saveError: null,
        hasConflict: false,
      }));

    case "save-failed":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        isDirty: file.currentContent !== file.savedContent,
        isSaving: false,
        saveError: action.error,
        hasConflict: action.conflict,
      }));

    case "replace-with-server":
      return updateFile(state, action.fileId, (file) => ({
        ...file,
        name: action.file.name,
        language: action.file.language,
        savedContent: action.file.content,
        currentContent: action.file.content,
        savedUpdatedAt: action.file.updatedAt,
        isDirty: false,
        isSaving: false,
        saveError: null,
        hasConflict: false,
        loadStatus: "loaded",
        loadError: null,
      }));

    case "sync-metadata": {
      const metadataById = new Map(
        action.metadata.map((metadata) => [metadata.node.id, metadata]),
      );
      const files = { ...state.files };

      for (const fileId of state.openFileIds) {
        const file = files[fileId];
        const metadata = metadataById.get(fileId);

        if (!file || !metadata) {
          continue;
        }

        files[fileId] = {
          ...file,
          name: metadata.node.name,
          path: metadata.path,
          language: metadata.node.language ?? "plaintext",
          savedUpdatedAt:
            metadata.node.updatedAt === file.savedUpdatedAt ||
            metadata.node.updatedAt < file.savedUpdatedAt
              ? file.savedUpdatedAt
              : metadata.node.updatedAt,
        };
      }

      return { ...state, files };
    }

    case "close-file":
      return closeFiles(state, [action.fileId]);

    case "close-files":
      return closeFiles(state, action.fileIds);
  }
}
