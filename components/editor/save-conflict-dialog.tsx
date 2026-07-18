"use client";

import { useState } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import type { OpenEditorFile } from "@/lib/editor/editor.types";
import type { ProjectFileContent } from "@/lib/files/file.types";

interface SaveConflictDialogProps {
  file: OpenEditorFile;
  serverFile: ProjectFileContent | null;
  isReviewing: boolean;
  reviewError: string | null;
  onReview: () => void;
  onOverwrite: () => void;
  onUseServerVersion: () => void;
  onCancel: () => void;
}

export function SaveConflictDialog({
  file,
  serverFile,
  isReviewing,
  reviewError,
  onReview,
  onOverwrite,
  onUseServerVersion,
  onCancel,
}: SaveConflictDialogProps) {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open && !file.isSaving) {
          onCancel();
        }
      }}
      title="Save conflict"
      description="The server version changed after this file was opened. Your local edits are still safe."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={file.isSaving || isReviewing}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={file.isSaving || isReviewing}
            onClick={onReview}
          >
            {isReviewing ? "Loading…" : "Review Server Version"}
          </Button>
          {confirmOverwrite ? (
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={file.isSaving}
              onClick={onOverwrite}
            >
              {file.isSaving ? "Overwriting…" : "Confirm Overwrite"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={file.isSaving}
              onClick={() => setConfirmOverwrite(true)}
            >
              Overwrite Server Version
            </Button>
          )}
        </>
      }
    >
      {reviewError ? (
        <p role="alert" className="text-sm text-destructive">
          {reviewError}
        </p>
      ) : null}
      {confirmOverwrite ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Confirming will replace the newer server content with your local
          version.
        </p>
      ) : null}
      {serverFile ? (
        <div className="grid max-h-[55vh] gap-3 overflow-auto md:grid-cols-2">
          <section className="min-w-0">
            <h3 className="mb-2 text-xs font-medium">Your local version</h3>
            <pre className="max-h-72 overflow-auto rounded-xl border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
              {file.currentContent}
            </pre>
          </section>
          <section className="min-w-0">
            <h3 className="mb-2 text-xs font-medium">Server version</h3>
            <pre className="max-h-72 overflow-auto rounded-xl border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
              {serverFile.content}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl"
              disabled={file.isSaving}
              onClick={onUseServerVersion}
            >
              Replace Local With Server
            </Button>
          </section>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Review both versions before deciding which content to keep.
        </p>
      )}
    </AppDialog>
  );
}
