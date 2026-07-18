"use client";

import { useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameNodeAction } from "@/lib/files/file.actions";
import { MAX_PROJECT_NODE_NAME_LENGTH } from "@/lib/files/file.constants";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

const RENAME_NODE_FORM_ID = "rename-project-node-form";

interface RenameNodeDialogProps {
  open: boolean;
  node: ProjectNodeListItem;
  onOpenChange: (open: boolean) => void;
}

export function RenameNodeDialog({
  open,
  node,
  onOpenChange,
}: RenameNodeDialogProps) {
  const [name, setName] = useState(node.name);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedName = name.trim();
  const canSubmit =
    normalizedName.length > 0 &&
    normalizedName.length <= MAX_PROJECT_NODE_NAME_LENGTH &&
    normalizedName !== node.name &&
    !isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      onOpenChange(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setError(null);
    setFieldError(null);

    startTransition(async () => {
      const result = await renameNodeAction({
        projectId: node.projectId,
        nodeId: node.id,
        name,
      });

      if (!result.success) {
        setError(result.error);
        setFieldError(result.fieldErrors?.name?.[0] ?? null);
        return;
      }

      onOpenChange(false);
    });
  }

  function selectEditableName(input: HTMLInputElement) {
    const extensionStart =
      node.type === "FILE" ? input.value.lastIndexOf(".") : -1;
    input.setSelectionRange(
      0,
      extensionStart > 0 ? extensionStart : input.value.length,
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Rename ${node.type === "FILE" ? "file" : "folder"}`}
      description={`Choose a new name for "${node.name}".`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={RENAME_NODE_FORM_ID}
            className="rounded-xl"
            disabled={!canSubmit}
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id={RENAME_NODE_FORM_ID}
        className="space-y-3"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="rename-node-name">Name</Label>
          <Input
            id="rename-node-name"
            autoFocus
            required
            maxLength={MAX_PROJECT_NODE_NAME_LENGTH}
            value={name}
            disabled={isPending}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError ? "rename-node-name-error" : undefined
            }
            onFocus={(event) => selectEditableName(event.currentTarget)}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError(null);
              setError(null);
            }}
          />
          {fieldError ? (
            <p
              id="rename-node-name-error"
              className="text-sm text-destructive"
            >
              {fieldError}
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
