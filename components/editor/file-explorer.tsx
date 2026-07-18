"use client";

import { FilePlus, FolderPlus } from "lucide-react";

import { FileTree } from "@/components/files/file-tree";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileDialogController } from "@/hooks/use-file-dialogs";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

interface FileExplorerProps {
  projectName: string;
  nodes: ProjectNodeListItem[];
  activeFileId: string | null;
  canWrite: boolean;
  hasError: boolean;
  dialogs: FileDialogController;
  onFileSelect: (fileId: string) => void;
}

export function FileExplorer({
  projectName,
  nodes,
  activeFileId,
  canWrite,
  hasError,
  dialogs,
  onFileSelect,
}: FileExplorerProps) {
  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col border-r bg-card/20"
      aria-label="File explorer"
    >
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Explorer
          </p>
          <h2 className="truncate text-sm font-medium">{projectName}</h2>
        </div>
        {canWrite ? (
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              aria-label="New file at project root"
              onClick={() => dialogs.openCreateFile(null)}
            >
              <FilePlus aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              aria-label="New folder at project root"
              onClick={() => dialogs.openCreateFolder(null)}
            >
              <FolderPlus aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {hasError ? (
          <div className="px-4 py-5">
            <p className="text-sm font-medium">Files unavailable</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The project tree could not be loaded. Try opening the project
              again.
            </p>
          </div>
        ) : nodes.length > 0 ? (
          <FileTree
            nodes={nodes}
            activeFileId={activeFileId}
            canWrite={canWrite}
            dialogs={dialogs}
            onFileSelect={onFileSelect}
          />
        ) : (
          <div className="px-4 py-5">
            <p className="text-sm font-medium">No files yet</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create a file or folder to begin building this project.
            </p>
            {canWrite ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-xl"
                onClick={() => dialogs.openCreateFile(null)}
              >
                <FilePlus aria-hidden="true" />
                New file
              </Button>
            ) : null}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
