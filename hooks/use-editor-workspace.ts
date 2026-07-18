"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  editorWorkspaceReducer,
  initialEditorWorkspaceState,
} from "@/lib/editor/editor-reducer";
import type {
  EditorFileMetadata,
  EditorTab,
} from "@/lib/editor/editor.types";
import {
  getFileContentAction,
  updateFileContentAction,
} from "@/lib/files/file.actions";
import type {
  ProjectFileContent,
  ProjectNodeListItem,
} from "@/lib/files/file.types";

const FILE_LOAD_FALLBACK = "The file could not be opened. Try again.";
const FILE_SAVE_FALLBACK = "The file could not be saved. Try again.";

interface UseEditorWorkspaceOptions {
  projectId: string;
  canWrite: boolean;
}

export function useEditorWorkspace({
  projectId,
  canWrite,
}: UseEditorWorkspaceOptions) {
  const [state, dispatch] = useReducer(
    editorWorkspaceReducer,
    initialEditorWorkspaceState,
  );
  const stateRef = useRef(state);
  const loadingFileIdsRef = useRef(new Set<string>());
  const savingFileIdsRef = useRef(new Set<string>());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadFile = useCallback(
    async (fileId: string, replaceLocalContent = false) => {
      if (loadingFileIdsRef.current.has(fileId)) {
        return null;
      }

      loadingFileIdsRef.current.add(fileId);

      try {
        const result = await getFileContentAction({ projectId, fileId });

        if (!result.success) {
          dispatch({
            type: "file-load-failed",
            fileId,
            error: result.error,
          });
          return null;
        }

        dispatch(
          replaceLocalContent
            ? {
                type: "replace-with-server",
                fileId,
                file: result.data,
              }
            : { type: "file-loaded", file: result.data },
        );
        return result.data;
      } catch {
        dispatch({
          type: "file-load-failed",
          fileId,
          error: FILE_LOAD_FALLBACK,
        });
        return null;
      } finally {
        loadingFileIdsRef.current.delete(fileId);
      }
    },
    [projectId],
  );

  const openFile = useCallback(
    (metadata: EditorFileMetadata) => {
      if (metadata.node.type !== "FILE") {
        return;
      }

      const isAlreadyOpen = Boolean(
        stateRef.current.files[metadata.node.id],
      );
      dispatch({ type: "open-file", metadata });

      if (!isAlreadyOpen) {
        void loadFile(metadata.node.id);
      }
    },
    [loadFile],
  );

  const retryFileLoad = useCallback(
    (fileId: string) => {
      dispatch({ type: "retry-load", fileId });
      void loadFile(fileId);
    },
    [loadFile],
  );

  const reviewServerVersion = useCallback(
    async (fileId: string) => {
      if (loadingFileIdsRef.current.has(fileId)) {
        return null;
      }

      loadingFileIdsRef.current.add(fileId);

      try {
        const result = await getFileContentAction({ projectId, fileId });
        return result.success ? result.data : null;
      } catch {
        return null;
      } finally {
        loadingFileIdsRef.current.delete(fileId);
      }
    },
    [projectId],
  );

  const replaceWithServerVersion = useCallback(
    (file: ProjectFileContent) => {
      dispatch({
        type: "replace-with-server",
        fileId: file.id,
        file,
      });
    },
    [],
  );

  const saveFile = useCallback(
    async (fileId: string, forceOverwrite = false) => {
      const file = stateRef.current.files[fileId];

      if (
        !canWrite ||
        !file ||
        file.loadStatus !== "loaded" ||
        file.isSaving ||
        (!file.isDirty && !forceOverwrite) ||
        savingFileIdsRef.current.has(fileId)
      ) {
        return false;
      }

      const savedContent = file.currentContent;
      const expectedUpdatedAt = file.savedUpdatedAt;
      savingFileIdsRef.current.add(fileId);
      dispatch({ type: "save-started", fileId });

      try {
        const result = await updateFileContentAction({
          projectId,
          fileId,
          content: savedContent,
          expectedUpdatedAt,
          forceOverwrite,
        });

        if (!result.success) {
          dispatch({
            type: "save-failed",
            fileId,
            error: result.error,
            conflict: result.code === "CONFLICT",
          });
          return false;
        }

        dispatch({
          type: "save-succeeded",
          fileId,
          savedContent,
          updatedAt: result.data.updatedAt,
        });
        return true;
      } catch {
        dispatch({
          type: "save-failed",
          fileId,
          error: FILE_SAVE_FALLBACK,
          conflict: false,
        });
        return false;
      } finally {
        savingFileIdsRef.current.delete(fileId);
      }
    },
    [canWrite, projectId],
  );

  const saveActiveFile = useCallback(() => {
    const fileId = stateRef.current.activeFileId;
    return fileId ? saveFile(fileId) : Promise.resolve(false);
  }, [saveFile]);

  const updateContent = useCallback((fileId: string, content: string) => {
    dispatch({ type: "content-changed", fileId, content });
  }, []);

  const activateFile = useCallback((fileId: string) => {
    dispatch({ type: "activate-file", fileId });
  }, []);

  const closeFile = useCallback((fileId: string) => {
    dispatch({ type: "close-file", fileId });
  }, []);

  const syncNodes = useCallback((nodes: ProjectNodeListItem[]) => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const deletedOpenFileIds = stateRef.current.openFileIds.filter(
      (fileId) => !nodeById.has(fileId),
    );

    if (deletedOpenFileIds.length > 0) {
      dispatch({ type: "close-files", fileIds: deletedOpenFileIds });
    }

    const metadata: EditorFileMetadata[] = [];

    for (const fileId of stateRef.current.openFileIds) {
      const node = nodeById.get(fileId);

      if (!node || node.type !== "FILE") {
        continue;
      }

      const segments = [node.name];
      const visited = new Set([node.id]);
      let parentId = node.parentId;

      while (parentId) {
        const parent = nodeById.get(parentId);

        if (!parent || visited.has(parent.id)) {
          break;
        }

        visited.add(parent.id);
        segments.unshift(parent.name);
        parentId = parent.parentId;
      }

      metadata.push({ node, path: segments.join("/") });
    }

    dispatch({ type: "sync-metadata", metadata });
  }, []);

  const closeDeletedNode = useCallback(
    (nodeId: string, descendantIds: Iterable<string>) => {
      const deletedIds = new Set(descendantIds);
      deletedIds.add(nodeId);
      const openFileIds = stateRef.current.openFileIds.filter((fileId) =>
        deletedIds.has(fileId),
      );

      if (openFileIds.length > 0) {
        dispatch({ type: "close-files", fileIds: openFileIds });
      }
    },
    [],
  );

  const tabs = useMemo<EditorTab[]>(
    () =>
      state.openFileIds.flatMap((fileId) => {
        const file = state.files[fileId];

        return file
          ? [
              {
                fileId,
                name: file.name,
                path: file.path,
                language: file.language,
                isDirty: file.isDirty,
                isActive: state.activeFileId === fileId,
                isLoading: file.loadStatus === "loading",
                hasError: file.loadStatus === "error",
              },
            ]
          : [];
      }),
    [state.activeFileId, state.files, state.openFileIds],
  );
  const activeFile = state.activeFileId
    ? (state.files[state.activeFileId] ?? null)
    : null;
  const hasDirtyFiles = state.openFileIds.some(
    (fileId) => state.files[fileId]?.isDirty,
  );

  return {
    state,
    tabs,
    activeFile,
    hasDirtyFiles,
    openFile,
    activateFile,
    updateContent,
    saveFile,
    saveActiveFile,
    closeFile,
    retryFileLoad,
    reviewServerVersion,
    replaceWithServerVersion,
    syncNodes,
    closeDeletedNode,
  };
}
