"use client";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import type { OpenEditorFile } from "@/lib/editor/editor.types";

interface UnsavedChangesDialogProps {
  file: OpenEditorFile | null;
  onSaveAndClose: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  file,
  onSaveAndClose,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  if (!file) {
    return null;
  }

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open && !file.isSaving) {
          onCancel();
        }
      }}
      title="Unsaved changes"
      description={`Save your changes to "${file.name}" before closing it?`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={file.isSaving}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={file.isSaving}
            onClick={onDiscard}
          >
            Close Without Saving
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={file.isSaving}
            onClick={onSaveAndClose}
          >
            {file.isSaving ? "Saving…" : "Save and Close"}
          </Button>
        </>
      }
    >
      {file.saveError ? (
        <p role="alert" className="text-sm text-destructive">
          {file.saveError}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Closing without saving keeps the last version stored on the
          server.
        </p>
      )}
    </AppDialog>
  );
}
