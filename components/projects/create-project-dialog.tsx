"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/projects/project.actions";
import { toProjectSlug } from "@/lib/projects/project-slug";

const CREATE_PROJECT_FORM_ID = "create-project-form";

interface CreateProjectDialogProps {
  onClose: () => void;
}

export function CreateProjectDialog({
  onClose,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedName = name.trim();
  const canSubmit =
    normalizedName.length > 0 &&
    normalizedName.length <= 80 &&
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
      const result = await createProject({ name });

      if (!result.success) {
        setError(result.error);
        setFieldError(result.fieldErrors?.name?.[0] ?? null);
        return;
      }

      onClose();
      router.push(`/editor/${result.data.projectId}`);
    });
  }

  return (
    <AppDialog
      open
      onOpenChange={handleOpenChange}
      title="Create project"
      description="Start a persistent collaborative workspace."
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
            form={CREATE_PROJECT_FORM_ID}
            className="rounded-xl"
            disabled={!canSubmit}
          >
            {isPending ? "Creating…" : "Create Project"}
          </Button>
        </>
      }
    >
      <form
        id={CREATE_PROJECT_FORM_ID}
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="create-project-name">Project name</Label>
          <Input
            id="create-project-name"
            name="name"
            autoFocus
            required
            maxLength={80}
            value={name}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError
                ? "create-project-name-error"
                : "create-project-url-help"
            }
            disabled={isPending}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError(null);
              setError(null);
            }}
          />
          {fieldError ? (
            <p
              id="create-project-name-error"
              className="text-sm text-destructive"
            >
              {fieldError}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Project slug
          </p>
          <p className="mt-1 truncate font-mono text-sm text-foreground">
            {toProjectSlug(name)}
          </p>
          <p
            id="create-project-url-help"
            className="mt-1 text-xs text-muted-foreground"
          >
            The final slug may adjust if this name is already in use.
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
