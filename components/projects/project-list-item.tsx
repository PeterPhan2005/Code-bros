"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { useProjectDialogs } from "@/components/projects/project-dialog-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectListItem as ProjectListItemType } from "@/lib/projects/project.types";
import { requestEditorNavigation } from "@/lib/editor/unsaved-navigation";

interface ProjectListItemProps {
  project: ProjectListItemType;
  active: boolean;
  onProjectSelect: () => void;
}

export function ProjectListItem({
  project,
  active,
  onProjectSelect,
}: ProjectListItemProps) {
  const { openRename, openDelete } = useProjectDialogs();
  const isOwned = project.ownership === "owned";

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center rounded-xl border border-transparent",
        active && "border-sidebar-border bg-sidebar-accent",
      )}
    >
      <Link
        href={`/editor/${project.id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 rounded-xl px-3 py-2 outline-none transition-colors",
          "hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        )}
        onClick={(event) => {
          if (
            !active &&
            !requestEditorNavigation(`/editor/${project.id}`)
          ) {
            event.preventDefault();
            return;
          }

          onProjectSelect();
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">
            {project.name}
          </span>
          {!isOwned ? (
            <Badge
              variant="outline"
              className="ml-auto shrink-0 text-[0.65rem]"
            >
              {project.role === "EDITOR" ? "Editor" : "Viewer"}
            </Badge>
          ) : null}
        </span>
      </Link>

      {isOwned ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mr-1 shrink-0 rounded-xl opacity-70 hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Project actions for ${project.name}`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => openRename(project)}>
              <Pencil aria-hidden="true" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => openDelete(project)}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
