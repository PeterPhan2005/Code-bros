"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

interface EditorShellProps {
  children: ReactNode;
}

export function EditorShell({ children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function toggleSidebar() {
    setIsSidebarOpen((currentValue) => !currentValue);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={toggleSidebar}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <main className="h-full pt-12">{children}</main>
    </div>
  );
}
