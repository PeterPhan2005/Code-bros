const FILE_TYPE_BY_EXTENSION: Record<
  string,
  { language: string; mimeType: string }
> = {
  ".css": { language: "css", mimeType: "text/css" },
  ".html": { language: "html", mimeType: "text/html" },
  ".js": { language: "javascript", mimeType: "text/javascript" },
  ".jsx": { language: "javascript", mimeType: "text/javascript" },
  ".json": { language: "json", mimeType: "application/json" },
  ".md": { language: "markdown", mimeType: "text/markdown" },
  ".mjs": { language: "javascript", mimeType: "text/javascript" },
  ".py": { language: "python", mimeType: "text/x-python" },
  ".ts": { language: "typescript", mimeType: "text/typescript" },
  ".tsx": { language: "typescript", mimeType: "text/typescript" },
  ".txt": { language: "plaintext", mimeType: "text/plain" },
};

export function detectFileType(name: string) {
  const dotIndex = name.lastIndexOf(".");
  const extension =
    dotIndex > 0 ? name.slice(dotIndex).toLocaleLowerCase("en-US") : "";

  return (
    FILE_TYPE_BY_EXTENSION[extension] ?? {
      language: "plaintext",
      mimeType: "text/plain",
    }
  );
}
