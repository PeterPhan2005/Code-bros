"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";

import { AppDialog } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { moveNodeAction } from "@/lib/files/file.actions";
import {
  getDescendantNodeIds,
  getProjectNodePath,
} from "@/lib/files/build-file-tree";
import type { ProjectNodeListItem } from "@/lib/files/file.types";

const MOVE_NODE_FORM_ID = "move-project-node-form";
const ROOT_VALUE = "__project_root__";

interface MoveNodeDialogProps {
  open: boolean;
  node: ProjectNodeListItem;
  nodes: ProjectNodeListItem[];
  onOpenChange: (open: boolean) => void;
}

interface Destination {
  id: string | null;
  label: string;
}

export function MoveNodeDialog({
  open,
  node,
  nodes,
  onOpenChange,
}: MoveNodeDialogProps) {
  const destinations = useMemo(() => {
    const invalidIds =
      node.type === "FOLDER"
        ? getDescendantNodeIds(nodes, node.id)
        : new Set<string>();
    invalidIds.add(node.id);

    const available: Destination[] = [];

    if (node.parentId !== null) {
      available.push({ id: null, label: "Project root /" });
    }

    for (const folder of nodes) {
      if (
        folder.type !== "FOLDER" ||
        folder.id === node.parentId ||
        invalidIds.has(folder.id)
      ) {
        continue;
      }

      available.push({
        id: folder.id,
        label: getProjectNodePath(nodes, folder.id) ?? folder.name,
      });
    }

    return available.sort((first, second) =>
      first.label.localeCompare(second.label, "en-US", {
        sensitivity: "base",
      }),
    );
  }, [node, nodes]);
  const [destinationValue, setDestinationValue] = useState(
    destinations[0]?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSubmit = destinations.length > 0 && !isPending;

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

    startTransition(async () => {
      const result = await moveNodeAction({
        projectId: node.projectId,
        nodeId: node.id,
        targetParentId: destinationValue,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
    });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Move "${node.name}"`}
      description="Choose a destination folder in this project."
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
            form={MOVE_NODE_FORM_ID}
            className="rounded-xl"
            disabled={!canSubmit}
          >
            {isPending ? "Moving…" : "Move"}
          </Button>
        </>
      }
    >
      <form
        id={MOVE_NODE_FORM_ID}
        className="space-y-3"
        onSubmit={handleSubmit}
      >
        {destinations.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="move-node-destination">Destination</Label>
            <select
              id="move-node-destination"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              value={destinationValue ?? ROOT_VALUE}
              disabled={isPending}
              onChange={(event) => {
                setDestinationValue(
                  event.target.value === ROOT_VALUE
                    ? null
                    : event.target.value,
                );
                setError(null);
              }}
            >
              {destinations.map((destination) => (
                <option
                  key={destination.id ?? ROOT_VALUE}
                  value={destination.id ?? ROOT_VALUE}
                >
                  {destination.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No other valid destination folders are available.
          </p>
        )}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
