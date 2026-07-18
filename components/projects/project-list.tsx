"use client";

import type { ProjectListItem as ProjectListItemType } from "@/lib/projects/project.types";

import { ProjectListItem } from "./project-list-item";

interface ProjectListProps {
  projects: ProjectListItemType[];
  currentProjectId?: string;
  onProjectSelect: () => void;
}

export function ProjectList({
  projects,
  currentProjectId,
  onProjectSelect,
}: ProjectListProps) {
  return (
    <ul className="space-y-1 p-3">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectListItem
            project={project}
            active={project.id === currentProjectId}
            onProjectSelect={onProjectSelect}
          />
        </li>
      ))}
    </ul>
  );
}
