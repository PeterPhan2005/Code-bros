"use client";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getEditorSaveStatus,
  type OpenEditorFile,
} from "@/lib/editor/editor.types";

const SAVE_STATUS_LABELS = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  failed: "Save failed",
  conflict: "Conflict",
} as const;

interface EditorToolbarProps {
  file: OpenEditorFile;
  readOnly: boolean;
  onSave: () => void;
}

export function EditorToolbar({
  file,
  readOnly,
  onSave,
}: EditorToolbarProps) {
  const saveStatus = getEditorSaveStatus(file);

  return (
    <div className="flex h-9 shrink-0 items-center gap-3 border-b px-3 text-xs">
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {file.path}
      </span>
      {readOnly ? (
        <span className="rounded-lg border px-2 py-0.5 text-muted-foreground">
          Read only
        </span>
      ) : null}
      <span aria-live="polite" className="text-muted-foreground">
        {SAVE_STATUS_LABELS[saveStatus]}
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              disabled={
                readOnly ||
                !file.isDirty ||
                file.isSaving ||
                file.loadStatus !== "loaded"
              }
              aria-label={
                file.isSaving ? `Saving ${file.name}` : `Save ${file.name}`
              }
              onClick={onSave}
            >
              <Save aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save file (Ctrl/Cmd + S)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
