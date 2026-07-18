"use client";

import {
  Braces,
  Circle,
  File,
  FileCode2,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EditorTab as EditorTabState } from "@/lib/editor/editor.types";
import { cn } from "@/lib/utils";

interface EditorTabProps {
  tab: EditorTabState;
  onActivate: (fileId: string) => void;
  onClose: (fileId: string) => void;
}

function TabFileIcon({ language }: { language: string }) {
  if (language === "json") {
    return <Braces className="size-3.5" aria-hidden="true" />;
  }

  if (language === "markdown" || language === "plaintext") {
    return <FileText className="size-3.5" aria-hidden="true" />;
  }

  if (language === "typescript" || language === "javascript") {
    return <FileCode2 className="size-3.5" aria-hidden="true" />;
  }

  return <File className="size-3.5" aria-hidden="true" />;
}

export function EditorTab({
  tab,
  onActivate,
  onClose,
}: EditorTabProps) {
  return (
    <div
      role="presentation"
      title={tab.path}
      className={cn(
        "group/tab relative flex h-10 min-w-36 max-w-56 shrink-0 items-center border-r px-2 text-sm outline-none",
        "focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring/70",
        tab.isActive
          ? "bg-background text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
          : "bg-card/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab.isActive}
        aria-controls="code-editor-canvas"
        className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none"
        onClick={() => onActivate(tab.fileId)}
      >
        <span className="shrink-0" aria-hidden="true">
          {tab.isLoading ? (
            <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
          ) : (
            <TabFileIcon language={tab.language} />
          )}
        </span>
        <span className="truncate">{tab.name}</span>
        {tab.hasError ? (
          <span className="sr-only">File failed to load</span>
        ) : null}
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="ml-1 rounded-lg"
        aria-label={
          tab.isDirty
            ? `Close modified file ${tab.name}`
            : `Close ${tab.name}`
        }
        onClick={(event) => {
          event.stopPropagation();
          onClose(tab.fileId);
        }}
      >
        {tab.isDirty ? (
          <>
            <Circle
              className="fill-current group-hover/tab:hidden group-focus-within/tab:hidden"
              aria-hidden="true"
            />
            <X
              className="hidden group-hover/tab:block group-focus-within/tab:block"
              aria-hidden="true"
            />
            <span className="sr-only">Modified</span>
          </>
        ) : (
          <X aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
