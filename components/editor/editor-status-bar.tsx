"use client";

import {
  getEditorSaveStatus,
  type OpenEditorFile,
} from "@/lib/editor/editor.types";

const LANGUAGE_LABELS: Record<string, string> = {
  css: "CSS",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  plaintext: "Plain Text",
  python: "Python",
  scss: "SCSS",
  shell: "Shell",
  sql: "SQL",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
};

const STATUS_LABELS = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  failed: "Save failed",
  conflict: "Conflict",
} as const;

interface CursorPosition {
  line: number;
  column: number;
}

interface EditorStatusBarProps {
  file: OpenEditorFile;
  cursor: CursorPosition;
  readOnly: boolean;
}

export function EditorStatusBar({
  file,
  cursor,
  readOnly,
}: EditorStatusBarProps) {
  return (
    <div className="flex h-7 shrink-0 items-center gap-4 border-t px-3 text-[11px] text-muted-foreground">
      <span>
        Ln {cursor.line}, Col {cursor.column}
      </span>
      <span>Spaces: 2</span>
      <span>
        {LANGUAGE_LABELS[file.language] ?? file.language}
      </span>
      <span className="ml-auto" aria-live="polite">
        {readOnly
          ? "Read only"
          : STATUS_LABELS[getEditorSaveStatus(file)]}
      </span>
    </div>
  );
}
