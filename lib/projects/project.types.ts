export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  ownership: "owned" | "shared";
  role: ProjectRole;
}

export interface AccessibleProject {
  id: string;
  name: string;
  slug: string;
  ownership: "owned" | "shared";
  role: ProjectRole;
}

export interface ProjectLists {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

export type ActionResult<T = undefined> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
