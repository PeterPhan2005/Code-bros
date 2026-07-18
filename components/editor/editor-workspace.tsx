"use client";

import { AlertTriangle, FileCode2, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CodeEditor } from "@/components/editor/code-editor";
import { EditorStatusBar } from "@/components/editor/editor-status-bar";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { FileExplorer } from "@/components/editor/file-explorer";
import { SaveConflictDialog } from "@/components/editor/save-conflict-dialog";
import { UnsavedChangesDialog } from "@/components/editor/unsaved-changes-dialog";
import { FileDialogs } from "@/components/files/file-dialogs";
import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditorWorkspace } from "@/hooks/use-editor-workspace";
import { useFileDialogs } from "@/hooks/use-file-dialogs";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { getDescendantNodeIds, getProjectNodePath } from "@/lib/files/build-file-tree";
import { MonacoModelRegistry } from "@/lib/editor/monaco-model-registry";
import type { OpenEditorFile } from "@/lib/editor/editor.types";
import type {
  ProjectFileContent,
  ProjectNodeListItem,
} from "@/lib/files/file.types";
import type { ProjectRole } from "@/lib/projects/project.types";

interface EditorWorkspaceProps {
  projectId: string;
  projectName: string;
  projectRole: ProjectRole;
  initialTree: ProjectNodeListItem[];
  treeError?: boolean;
  initialFileId?: string | null;
}

interface LoadedEditorCanvasProps {
  file: OpenEditorFile;
  canWrite: boolean;
  registry: MonacoModelRegistry;
  onChange: (fileId: string, value: string) => void;
  onSaveActive: () => void;
  onRetrySave: (fileId: string) => void;
}

function LoadedEditorCanvas({
  file,
  canWrite,
  registry,
  onChange,
  onSaveActive,
  onRetrySave,
}: LoadedEditorCanvasProps) {
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <CodeEditor
          fileId={file.id}
          fileName={file.name}
          content={file.currentContent}
          language={file.language}
          readOnly={!canWrite}
          registry={registry}
          onChange={onChange}
          onSave={onSaveActive}
          onCursorChange={(line, column) => {
            setCursor({ line, column });
          }}
        />
      </div>
      {file.saveError && !file.hasConflict ? (
        <div
          role="alert"
          className="flex items-center gap-2 border-t bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            {file.saveError}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="rounded-lg"
            onClick={() => onRetrySave(file.id)}
          >
            Retry save
          </Button>
        </div>
      ) : null}
      <EditorStatusBar
        file={file}
        cursor={cursor}
        readOnly={!canWrite}
      />
    </div>
  );
}

export function EditorWorkspace({
  projectId,
  projectName,
  projectRole,
  initialTree,
  treeError = false,
  initialFileId = null,
}: EditorWorkspaceProps) {
  const canWrite = projectRole !== "VIEWER";
  const router = useRouter();
  const dialogs = useFileDialogs();
  const editor = useEditorWorkspace({ projectId, canWrite });
  const { openFile, syncNodes } = editor;
  const registry = useMemo(
    () => new MonacoModelRegistry(projectId),
    [projectId],
  );
  const initialFileOpenedRef = useRef(false);
  const previousConflictRef = useRef(false);
  const [closingFileId, setClosingFileId] = useState<string | null>(
    null,
  );
  const [isConflictDialogOpen, setIsConflictDialogOpen] =
    useState(false);
  const [serverFile, setServerFile] =
    useState<ProjectFileContent | null>(null);
  const [isReviewingConflict, setIsReviewingConflict] =
    useState(false);
  const [conflictReviewError, setConflictReviewError] =
    useState<string | null>(null);
  const [pendingNavigationHref, setPendingNavigationHref] =
    useState<string | null>(null);

  const activeFile = editor.activeFile;
  const closingFile = closingFileId
    ? (editor.state.files[closingFileId] ?? null)
    : null;

  useUnsavedChangesWarning(editor.hasDirtyFiles, (href) => {
    setPendingNavigationHref(href);
  });

  useEffect(() => {
    syncNodes(initialTree);
  }, [initialTree, syncNodes]);

  useEffect(() => {
    if (
      initialFileOpenedRef.current ||
      !initialFileId ||
      treeError
    ) {
      return;
    }

    const node = initialTree.find(
      (candidate) =>
        candidate.id === initialFileId && candidate.type === "FILE",
    );

    initialFileOpenedRef.current = true;

    if (node) {
      openFile({
        node,
        path: getProjectNodePath(initialTree, node.id) ?? node.name,
      });
    }
  }, [initialFileId, initialTree, openFile, treeError]);

  useEffect(() => {
    registry.disposeExcept(editor.state.openFileIds);
  }, [editor.state.openFileIds, registry]);

  useEffect(() => {
    return () => {
      registry.disposeAll();
    };
  }, [registry]);

  useEffect(() => {
    const hasConflict = Boolean(activeFile?.hasConflict);

    if (hasConflict && !previousConflictRef.current) {
      setClosingFileId(null);
      setServerFile(null);
      setConflictReviewError(null);
      setIsConflictDialogOpen(true);
    }

    previousConflictRef.current = hasConflict;
  }, [activeFile?.hasConflict, activeFile?.id]);

  function handleFileSelect(fileId: string) {
    const node = initialTree.find(
      (candidate) =>
        candidate.id === fileId && candidate.type === "FILE",
    );

    if (!node) {
      return;
    }

    editor.openFile({
      node,
      path: getProjectNodePath(initialTree, node.id) ?? node.name,
    });
  }

  function requestCloseFile(fileId: string) {
    const file = editor.state.files[fileId];

    if (!file) {
      return;
    }

    if (file.isDirty) {
      setClosingFileId(fileId);
      return;
    }

    editor.closeFile(fileId);
  }

  async function handleSaveAndClose() {
    if (!closingFileId) {
      return;
    }

    const saved = await editor.saveFile(closingFileId);

    if (saved) {
      editor.closeFile(closingFileId);
      setClosingFileId(null);
    }
  }

  async function handleReviewServerVersion() {
    if (!activeFile) {
      return;
    }

    setIsReviewingConflict(true);
    setConflictReviewError(null);
    const file = await editor.reviewServerVersion(activeFile.id);

    if (!file) {
      setConflictReviewError(
        "The server version could not be loaded. Try again.",
      );
    } else {
      setServerFile(file);
    }

    setIsReviewingConflict(false);
  }

  async function handleOverwriteServerVersion() {
    if (!activeFile) {
      return;
    }

    const saved = await editor.saveFile(activeFile.id, true);

    if (saved) {
      setIsConflictDialogOpen(false);
      setServerFile(null);
    }
  }

  const editorCanvas = useMemo(() => {
    if (!activeFile) {
      return (
        <div className="flex h-full items-center justify-center px-6">
          <div className="max-w-md text-center">
            <FileCode2
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <h1 className="mt-4 font-heading text-lg font-semibold">
              Open a file to start editing
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a file from the explorer.
            </p>
          </div>
        </div>
      );
    }

    if (activeFile.loadStatus === "loading") {
      return (
        <div
          className="h-full p-6"
          aria-label="Opening file"
          aria-busy="true"
        >
          <div className="space-y-3">
            <Skeleton className="h-4 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </div>
        </div>
      );
    }

    if (activeFile.loadStatus === "error") {
      return (
        <div className="flex h-full items-center justify-center px-6">
          <div className="max-w-md text-center">
            <AlertTriangle
              className="mx-auto size-7 text-destructive"
              aria-hidden="true"
            />
            <p className="mt-3 font-medium">File unavailable</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeFile.loadError}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => editor.retryFileLoad(activeFile.id)}
              >
                <RefreshCw aria-hidden="true" />
                Retry
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => editor.closeFile(activeFile.id)}
              >
                <X aria-hidden="true" />
                Close
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <LoadedEditorCanvas
        file={activeFile}
        canWrite={canWrite}
        registry={registry}
        onChange={editor.updateContent}
        onSaveActive={() => {
          void editor.saveActiveFile();
        }}
        onRetrySave={(fileId) => {
          void editor.saveFile(fileId);
        }}
      />
    );
  }, [
    activeFile,
    canWrite,
    editor,
    registry,
  ]);

  return (
    <div className="flex h-full min-h-0">
      <FileExplorer
        projectName={projectName}
        nodes={initialTree}
        activeFileId={editor.state.activeFileId}
        canWrite={canWrite}
        hasError={treeError}
        dialogs={dialogs}
        onFileSelect={handleFileSelect}
      />

      <section
        className="flex min-w-0 flex-1 flex-col bg-background"
        aria-label="Editor workspace"
      >
        <EditorTabs
          tabs={editor.tabs}
          onActivate={editor.activateFile}
          onClose={requestCloseFile}
        />

        {activeFile ? (
          <EditorToolbar
            file={activeFile}
            readOnly={!canWrite}
            onSave={() => {
              void editor.saveActiveFile();
            }}
          />
        ) : null}

        <div className="min-h-0 flex-1">{editorCanvas}</div>

      </section>

      <FileDialogs
        controller={dialogs}
        projectId={projectId}
        nodes={initialTree}
        onFileCreated={(node) => {
          editor.openFile({
            node,
            path: getProjectNodePath(initialTree, node.id) ?? node.name,
          });
        }}
        onNodeDeleted={(nodeId) => {
          editor.closeDeletedNode(
            nodeId,
            getDescendantNodeIds(initialTree, nodeId),
          );
        }}
      />

      <UnsavedChangesDialog
        file={closingFile}
        onSaveAndClose={() => {
          void handleSaveAndClose();
        }}
        onDiscard={() => {
          if (closingFileId) {
            editor.closeFile(closingFileId);
          }
          setClosingFileId(null);
        }}
        onCancel={() => setClosingFileId(null)}
      />

      {isConflictDialogOpen && activeFile?.hasConflict ? (
        <SaveConflictDialog
          file={activeFile}
          serverFile={serverFile}
          isReviewing={isReviewingConflict}
          reviewError={conflictReviewError}
          onReview={() => {
            void handleReviewServerVersion();
          }}
          onOverwrite={() => {
            void handleOverwriteServerVersion();
          }}
          onUseServerVersion={() => {
            if (serverFile) {
              editor.replaceWithServerVersion(serverFile);
              setIsConflictDialogOpen(false);
              setServerFile(null);
            }
          }}
          onCancel={() => setIsConflictDialogOpen(false)}
        />
      ) : null}

      {pendingNavigationHref ? (
        <AppDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setPendingNavigationHref(null);
            }
          }}
          title="Leave with unsaved changes?"
          description="Unsaved editor content will be lost if you switch projects."
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPendingNavigationHref(null)}
              >
                Stay
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => {
                  const href = pendingNavigationHref;
                  setPendingNavigationHref(null);
                  router.push(href);
                }}
              >
                Leave Project
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Save or close your modified files first to keep your work.
          </p>
        </AppDialog>
      ) : null}
    </div>
  );
}
