const FILE_TYPE_BY_EXTENSION: Record<
  string,
  { language: string; mimeType: string }
> = {
  ".css": { language: "css", mimeType: "text/css" },
  ".html": { language: "html", mimeType: "text/html" },
  ".java": { language: "java", mimeType: "text/x-java-source" },
  ".js": { language: "javascript", mimeType: "text/javascript" },
  ".jsx": { language: "javascript", mimeType: "text/javascript" },
  ".json": { language: "json", mimeType: "application/json" },
  ".md": { language: "markdown", mimeType: "text/markdown" },
  ".mjs": { language: "javascript", mimeType: "text/javascript" },
  ".py": { language: "python", mimeType: "text/x-python" },
  ".scss": { language: "scss", mimeType: "text/x-scss" },
  ".sh": { language: "shell", mimeType: "application/x-sh" },
  ".sql": { language: "sql", mimeType: "application/sql" },
  ".ts": { language: "typescript", mimeType: "text/typescript" },
  ".tsx": { language: "typescript", mimeType: "text/typescript" },
  ".txt": { language: "plaintext", mimeType: "text/plain" },
  ".xml": { language: "xml", mimeType: "application/xml" },
  ".yaml": { language: "yaml", mimeType: "application/yaml" },
  ".yml": { language: "yaml", mimeType: "application/yaml" },
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
