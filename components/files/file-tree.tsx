"use client";

import { FileTreeItem } from "@/components/files/file-tree-item";
import type { FileDialogController } from "@/hooks/use-file-dialogs";
import { buildFileTree } from "@/lib/files/build-file-tree";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

interface FileTreeProps {
  nodes: ProjectNodeListItem[];
  activeFileId: string | null;
  canWrite: boolean;
  dialogs: FileDialogController;
  onFileSelect: (fileId: string) => void;
}

export function FileTree({
  nodes,
  activeFileId,
  canWrite,
  dialogs,
  onFileSelect,
}: FileTreeProps) {
  const tree = buildFileTree(nodes);

  return (
    <ul role="tree" aria-label="Project files" className="py-1">
      {tree.map((node) => (
        <FileTreeItem
          key={node.id}
          node={node}
          depth={0}
          activeFileId={activeFileId}
          canWrite={canWrite}
          dialogs={dialogs}
          onFileSelect={onFileSelect}
        />
      ))}
    </ul>
  );
}
