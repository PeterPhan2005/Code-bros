"use client";

import { useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameProject } from "@/lib/projects/project.actions";
import { toProjectSlug } from "@/lib/projects/project-slug";
import type { ProjectListItem } from "@/lib/projects/project.types";

const RENAME_PROJECT_FORM_ID = "rename-project-form";

interface RenameProjectDialogProps {
  project: ProjectListItem;
  onClose: () => void;
}

export function RenameProjectDialog({
  project,
  onClose,
}: RenameProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedName = name.trim();
  const canSubmit =
    normalizedName.length > 0 &&
    normalizedName.length <= 80 &&
    normalizedName !== project.name &&
    !isPending;

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) {
      onClose();
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
      const result = await renameProject({
        projectId: project.id,
        name,
      });

      if (!result.success) {
        setError(result.error);
        setFieldError(result.fieldErrors?.name?.[0] ?? null);
        return;
      }

      onClose();
    });
  }

  return (
    <AppDialog
      open
      onOpenChange={handleOpenChange}
      title="Rename project"
      description={`Choose a new name for "${project.name}".`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={RENAME_PROJECT_FORM_ID}
            className="rounded-xl"
            disabled={!canSubmit}
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form
        id={RENAME_PROJECT_FORM_ID}
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="rename-project-name">Project name</Label>
          <Input
            id="rename-project-name"
            name="name"
            autoFocus
            required
            maxLength={80}
            value={name}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError
                ? "rename-project-name-error"
                : "rename-project-url-help"
            }
            disabled={isPending}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError(null);
              setError(null);
            }}
          />
          {fieldError ? (
            <p
              id="rename-project-name-error"
              className="text-sm text-destructive"
            >
              {fieldError}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Project URL
          </p>
          <p className="mt-1 truncate font-mono text-sm text-foreground">
            /editor/{toProjectSlug(name)}
          </p>
          <p
            id="rename-project-url-help"
            className="mt-1 text-xs text-muted-foreground"
          >
            Your current project link remains valid because routing uses its
            stable ID.
          </p>
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
