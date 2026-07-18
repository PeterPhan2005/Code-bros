export type ProjectNodeType = "FILE" | "FOLDER";

export interface ProjectNodeListItem {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: ProjectNodeType;
  language: string | null;
  isProtected: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface ProjectFileContent {
  id: string;
  name: string;
  content: string;
  language: string;
  updatedAt: string;
}

export type FileSaveActionResult =
  | {
      success: true;
      data: {
        updatedAt: string;
      };
    }
  | {
      success: false;
      error: string;
      code?: "CONFLICT";
      fieldErrors?: Record<string, string[] | undefined>;
    };

export interface FileTreeNode extends ProjectNodeListItem {
  children: FileTreeNode[];
}

export interface FileMutationResult {
  node: ProjectNodeListItem;
  event:
    | "file-created"
    | "folder-created"
    | "node-renamed"
    | "node-moved"
    | "node-deleted"
    | "file-updated";
}
