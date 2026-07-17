"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="fixed inset-x-0 top-0 z-50 grid h-12 grid-cols-[3rem_minmax(0,1fr)_3rem] items-center border-b bg-background">
      <div className="flex h-full items-center justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-controls="project-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label={
            isSidebarOpen
              ? "Close projects sidebar"
              : "Open projects sidebar"
          }
          onClick={onSidebarToggle}
        >
          <SidebarIcon aria-hidden="true" />
        </Button>
      </div>

      <div className="min-w-0" />
      <div aria-hidden="true" />
    </header>
  );
}
