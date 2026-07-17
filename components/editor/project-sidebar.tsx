"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject?: () => void;
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

export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
}: ProjectSidebarProps) {
  return (
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
            <EmptyProjectState
              title="No projects yet"
              description="Projects you create will appear here."
            />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="shared" className="min-h-0">
          <ScrollArea className="h-full">
            <EmptyProjectState
              title="Nothing shared with you"
              description="Projects shared by collaborators will appear here."
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t p-4">
        <Button
          type="button"
          className="w-full rounded-xl"
          onClick={onNewProject}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
