"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import {
  useProjectDialogController,
  type ProjectDialogController,
} from "@/hooks/use-project-dialogs";

const ProjectDialogContext =
  createContext<ProjectDialogController | null>(null);

interface ProjectDialogProviderProps {
  children: ReactNode;
}

export function ProjectDialogProvider({
  children,
}: ProjectDialogProviderProps) {
  const controller = useProjectDialogController();

  return (
    <ProjectDialogContext value={controller}>
      {children}
    </ProjectDialogContext>
  );
}

export function useProjectDialogs() {
  const context = useContext(ProjectDialogContext);

  if (!context) {
    throw new Error(
      "useProjectDialogs must be used within ProjectDialogProvider.",
    );
  }

  return context;
}
