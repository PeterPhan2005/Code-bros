"use client";

import { Plus } from "lucide-react";

import { useProjectDialogs } from "@/components/projects/project-dialog-provider";
import { Button } from "@/components/ui/button";

export function ProjectHome() {
  const { openCreate } = useProjectDialogs();

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Create a project or open an existing one
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Start a collaborative coding workspace, invite teammates, and work
          with Code Bro in real time.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-6 rounded-xl"
          onClick={openCreate}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          New Project
        </Button>
      </div>
    </div>
  );
}
