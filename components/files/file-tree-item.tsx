"use client";

import {
  Braces,
  ChevronDown,
  ChevronRight,
  File,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Trash2,
  FilePlus,
  FolderInput,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileDialogController } from "@/hooks/use-file-dialogs";
import type { FileTreeNode } from "@/lib/files/file.types";
import { cn } from "@/lib/utils";

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  activeFileId: string | null;
  canWrite: boolean;
  dialogs: FileDialogController;
  onFileSelect: (fileId: string) => void;
}

function FileTypeIcon({ node }: { node: FileTreeNode }) {
  if (node.type === "FOLDER") {
    return <Folder className="size-4" aria-hidden="true" />;
  }

  if (node.language === "json") {
    return <Braces className="size-4" aria-hidden="true" />;
  }

  if (node.language === "markdown") {
    return <FileText className="size-4" aria-hidden="true" />;
  }

  if (
    node.language === "typescript" ||
    node.language === "javascript"
  ) {
    return <FileCode2 className="size-4" aria-hidden="true" />;
  }

  return <File className="size-4" aria-hidden="true" />;
}

export function FileTreeItem({
  node,
  depth,
  activeFileId,
  canWrite,
  dialogs,
  onFileSelect,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isFolder = node.type === "FOLDER";
  const isActive = !isFolder && activeFileId === node.id;
  const FolderIcon = isExpanded ? FolderOpen : Folder;

  function handlePrimaryAction() {
    if (isFolder) {
      setIsExpanded((currentValue) => !currentValue);
    } else {
      onFileSelect(node.id);
    }
  }

  return (
    <li
      role="treeitem"
      aria-expanded={isFolder ? isExpanded : undefined}
      aria-selected={isActive}
    >
      <div
        className={cn(
          "group flex min-w-0 items-center rounded-lg pr-1 transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted/60",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label={
            isFolder
              ? `${isExpanded ? "Collapse" : "Expand"} ${node.name}`
              : `Open ${node.name}`
          }
          onClick={handlePrimaryAction}
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <FolderIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" aria-hidden="true" />
              <span className="shrink-0 text-muted-foreground">
                <FileTypeIcon node={node} />
              </span>
            </>
          )}
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          {node.isProtected ? (
            <>
              <LockKeyhole
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="sr-only">Protected</span>
            </>
          ) : null}
        </button>

        {canWrite && (isFolder || !node.isProtected) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0 rounded-lg opacity-0 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${node.name}`}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              {isFolder ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => dialogs.openCreateFile(node.id)}
                  >
                    <FilePlus aria-hidden="true" />
                    New file
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => dialogs.openCreateFolder(node.id)}
                  >
                    <FolderPlus aria-hidden="true" />
                    New folder
                  </DropdownMenuItem>
                  {!node.isProtected ? (
                    <DropdownMenuSeparator />
                  ) : null}
                </>
              ) : null}
              {!node.isProtected ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => dialogs.openRename(node)}
                  >
                    <Pencil aria-hidden="true" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => dialogs.openMove(node)}
                  >
                    <FolderInput aria-hidden="true" />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => dialogs.openDelete(node)}
                  >
                    <Trash2 aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {isFolder && isExpanded && node.children.length > 0 ? (
        <ul role="group">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              canWrite={canWrite}
              dialogs={dialogs}
              onFileSelect={onFileSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
