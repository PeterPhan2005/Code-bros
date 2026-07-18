"use client";

import { useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createFileAction,
  createFolderAction,
} from "@/lib/files/file.actions";
import { MAX_PROJECT_NODE_NAME_LENGTH } from "@/lib/files/file.constants";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

const CREATE_NODE_FORM_ID = "create-project-node-form";

interface CreateNodeDialogProps {
  open: boolean;
  type: "file" | "folder";
  projectId: string;
  parentId: string | null;
  destinationPath: string;
  onOpenChange: (open: boolean) => void;
  onCreated?: (node: ProjectNodeListItem) => void;
}

export function CreateNodeDialog({
  open,
  type,
  projectId,
  parentId,
  destinationPath,
  onOpenChange,
  onCreated,
}: CreateNodeDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedName = name.trim();
  const canSubmit =
    normalizedName.length > 0 &&
    normalizedName.length <= MAX_PROJECT_NODE_NAME_LENGTH &&
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
      const action =
        type === "file" ? createFileAction : createFolderAction;
      const result = await action({ projectId, parentId, name });

      if (!result.success) {
        setError(result.error);
        setFieldError(result.fieldErrors?.name?.[0] ?? null);
        return;
      }

      onCreated?.(result.data.node);
      onOpenChange(false);
    });
  }

  const title = type === "file" ? "New file" : "New folder";

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={`Create ${type === "file" ? "a file" : "a folder"} in ${destinationPath}.`}
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
            form={CREATE_NODE_FORM_ID}
            className="rounded-xl"
            disabled={!canSubmit}
          >
            {isPending ? "Creating…" : `Create ${type}`}
          </Button>
        </>
      }
    >
      <form
        id={CREATE_NODE_FORM_ID}
        className="space-y-3"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="create-node-name">Name</Label>
          <Input
            id="create-node-name"
            autoFocus
            required
            maxLength={MAX_PROJECT_NODE_NAME_LENGTH}
            value={name}
            disabled={isPending}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError ? "create-node-name-error" : undefined
            }
            onChange={(event) => {
              setName(event.target.value);
              setFieldError(null);
              setError(null);
            }}
          />
          {fieldError ? (
            <p
              id="create-node-name-error"
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
