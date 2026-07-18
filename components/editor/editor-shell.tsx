"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogProvider } from "@/components/projects/project-dialog-provider";
import { ProjectDialogs } from "@/components/projects/project-dialogs";
import type { ProjectListItem } from "@/lib/projects/project.types";

interface EditorShellProps {
  children: ReactNode;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentProjectId?: string;
  projectsError?: boolean;
  projectsLoading?: boolean;
}

export function EditorShell({
  children,
  ownedProjects,
  sharedProjects,
  currentProjectId,
  projectsError = false,
  projectsLoading = false,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function toggleSidebar() {
    setIsSidebarOpen((currentValue) => !currentValue);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <ProjectDialogProvider>
      <div className="relative h-dvh overflow-hidden bg-background">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={toggleSidebar}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          currentProjectId={currentProjectId}
          projectsError={projectsError}
          projectsLoading={projectsLoading}
          onClose={closeSidebar}
        />
        <main className="h-full pt-12">{children}</main>
        <ProjectDialogs currentProjectId={currentProjectId} />
      </div>
    </ProjectDialogProvider>
  );
}
