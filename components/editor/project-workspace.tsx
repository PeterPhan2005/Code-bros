"use client";

import { FileCode2, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FileExplorer } from "@/components/editor/file-explorer";
import { FileDialogs } from "@/components/files/file-dialogs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveFile } from "@/hooks/use-active-file";
import { useFileDialogs } from "@/hooks/use-file-dialogs";
import { getFileContentAction } from "@/lib/files/file.actions";
import { getDescendantNodeIds } from "@/lib/files/build-file-tree";
import type {
  ProjectFileContent,
  ProjectNodeListItem,
} from "@/lib/files/file.types";
import type { AccessibleProject } from "@/lib/projects/project.types";

type FileLoadState =
  | {
      requestKey: string;
      status: "loaded";
      file: ProjectFileContent;
    }
  | {
      requestKey: string;
      status: "error";
      error: string;
    }
  | null;

interface ProjectWorkspaceProps {
  project: AccessibleProject;
  nodes: ProjectNodeListItem[];
  treeError?: boolean;
}

export function ProjectWorkspace({
  project,
  nodes,
  treeError = false,
}: ProjectWorkspaceProps) {
  const dialogs = useFileDialogs();
  const { activeFileId, selectFile, clearActiveFile } = useActiveFile();
  const [fileLoadState, setFileLoadState] =
    useState<FileLoadState>(null);
  const activeNode = useMemo(
    () => nodes.find((node) => node.id === activeFileId) ?? null,
    [activeFileId, nodes],
  );
  const canWrite = project.role !== "VIEWER";
  const fileRequestKey = activeFileId
    ? `${activeFileId}:${activeNode?.updatedAt ?? ""}`
    : null;
  const isCurrentFileState =
    fileRequestKey !== null &&
    fileLoadState?.requestKey === fileRequestKey;
  const file =
    isCurrentFileState && fileLoadState?.status === "loaded"
      ? fileLoadState.file
      : null;
  const fileError =
    isCurrentFileState && fileLoadState?.status === "error"
      ? fileLoadState.error
      : null;
  const isFileLoading =
    activeFileId !== null && !isCurrentFileState;

  useEffect(() => {
    if (!activeFileId || !fileRequestKey) {
      return;
    }

    let ignore = false;

    getFileContentAction({
      projectId: project.id,
      fileId: activeFileId,
    })
      .then((result) => {
        if (ignore) {
          return;
        }

        if (!result.success) {
          setFileLoadState({
            requestKey: fileRequestKey,
            status: "error",
            error: result.error,
          });
          return;
        }

        setFileLoadState({
          requestKey: fileRequestKey,
          status: "loaded",
          file: result.data,
        });
      })
      .catch(() => {
        if (!ignore) {
          setFileLoadState({
            requestKey: fileRequestKey,
            status: "error",
            error: "The file could not be opened. Try again.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeFileId, fileRequestKey, project.id]);

  function handleNodeDeleted(nodeId: string) {
    if (!activeFileId) {
      return;
    }

    const descendants = getDescendantNodeIds(nodes, nodeId);

    if (activeFileId === nodeId || descendants.has(activeFileId)) {
      clearActiveFile();
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <FileExplorer
        projectName={project.name}
        nodes={nodes}
        activeFileId={activeFileId}
        canWrite={canWrite}
        hasError={treeError}
        dialogs={dialogs}
        onFileSelect={selectFile}
      />

      <section
        className="min-w-0 flex-1 bg-background"
        aria-label="Editor canvas"
      >
        {isFileLoading ? (
          <div
            className="h-full p-6"
            aria-label="Opening file"
            aria-busy="true"
          >
            <div className="flex items-center gap-3 border-b pb-4">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-5 w-36 rounded-lg" />
            </div>
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-3/5 rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
          </div>
        ) : fileError ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-md text-center">
              <p className="font-medium">File unavailable</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {fileError}
              </p>
            </div>
          </div>
        ) : file ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-12 items-center gap-2 border-b px-4">
              <FileCode2
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h1 className="truncate text-sm font-medium">{file.name}</h1>
              <Badge variant="outline" className="ml-auto">
                {file.language}
              </Badge>
              {activeNode?.isProtected ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  Protected
                </span>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5">
              <pre className="min-h-full whitespace-pre-wrap font-mono text-sm leading-6 text-foreground">
                {file.content || (
                  <span className="text-muted-foreground">
                    This file is empty.
                  </span>
                )}
              </pre>
            </div>
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              Read-only preview · Monaco editing arrives in Feature 07
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {project.name}
                </h1>
                <Badge variant="outline">
                  {project.role === "OWNER"
                    ? "Owner"
                    : project.role === "EDITOR"
                      ? "Editor"
                      : "Viewer"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Select a file from the explorer to preview its persisted
                content.
              </p>
            </div>
          </div>
        )}
      </section>

      <FileDialogs
        controller={dialogs}
        projectId={project.id}
        nodes={nodes}
        onFileCreated={(node) => selectFile(node.id)}
        onNodeDeleted={handleNodeDeleted}
      />
    </div>
  );
}
