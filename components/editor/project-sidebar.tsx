"use client";

import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { useProjectDialogs } from "@/components/projects/project-dialog-provider";
import { ProjectList } from "@/components/projects/project-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/projects/project.types";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentProjectId?: string;
  projectsError?: boolean;
  projectsLoading?: boolean;
}

interface EmptyProjectStateProps {
  title: string;
  description: string;
}

function EmptyProjectState({
  title,
  description,
}: EmptyProjectStateProps) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-56 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ProjectListSkeleton() {
  return (
    <div
      className="space-y-2 p-4"
      aria-label="Loading projects"
      aria-busy="true"
    >
      <Skeleton className="h-9 w-full rounded-xl" />
      <Skeleton className="h-9 w-4/5 rounded-xl" />
      <Skeleton className="h-9 w-11/12 rounded-xl" />
    </div>
  );
}

function ProjectListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-foreground">
        Projects could not be loaded
      </p>
      <p className="mt-1 max-w-56 text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 rounded-xl"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects = [],
  sharedProjects = [],
  currentProjectId,
  projectsError = false,
  projectsLoading = false,
}: ProjectSidebarProps) {
  const router = useRouter();
  const { openCreate } = useProjectDialogs();

  function renderProjects(
    projects: ProjectListItem[],
    emptyTitle: string,
    emptyDescription: string,
  ) {
    if (projectsLoading) {
      return <ProjectListSkeleton />;
    }

    if (projectsError) {
      return <ProjectListError onRetry={() => router.refresh()} />;
    }

    if (projects.length === 0) {
      return (
        <EmptyProjectState
          title={emptyTitle}
          description={emptyDescription}
        />
      );
    }

    return (
      <ProjectList
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectSelect={onClose}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={!isOpen}
        aria-hidden={!isOpen}
        aria-label="Close projects sidebar"
        className={cn(
          "fixed inset-x-0 top-12 bottom-0 z-30 bg-background/70 backdrop-blur-[1px] transition-opacity duration-150 motion-reduce:transition-none md:hidden",
          isOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        id="project-sidebar"
        aria-hidden={!isOpen}
        aria-label="Projects"
        inert={!isOpen}
        className={cn(
          "fixed top-12 bottom-0 left-0 z-40 flex w-80 max-w-[calc(100vw-1rem)] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          isOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <h2 className="font-heading text-sm font-semibold">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Close projects sidebar"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList className="mx-4 mt-4 grid w-auto shrink-0 grid-cols-2 rounded-xl">
            <TabsTrigger value="my-projects" className="rounded-xl">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="rounded-xl">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="min-h-0">
            <ScrollArea className="h-full">
              {renderProjects(
                ownedProjects,
                "No projects yet",
                "Create your first collaborative workspace.",
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="shared" className="min-h-0">
            <ScrollArea className="h-full">
              {renderProjects(
                sharedProjects,
                "No shared projects",
                "Projects shared with you will appear here.",
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t p-4">
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={openCreate}
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
