import "server-only";

export type FileErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_PARENT"
  | "CYCLE"
  | "PROTECTED"
  | "TOO_LARGE";

export class FileDomainError extends Error {
  constructor(
    public readonly code: FileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FileDomainError";
  }
}
