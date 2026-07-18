import "server-only";

export type ProjectErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT";

export class ProjectDomainError extends Error {
  constructor(
    public readonly code: ProjectErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProjectDomainError";
  }
}
