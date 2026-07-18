import "server-only";

import { prisma } from "@/lib/db/prisma";
import { FileDomainError } from "@/lib/files/file.errors";
import type {
  ProjectFileContent,
  ProjectNodeListItem,
} from "@/lib/files/file.types";
import { requireProjectReadAccess } from "@/lib/projects/project-access";

function serializeNode(node: {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: "FILE" | "FOLDER";
  language: string | null;
  isProtected: boolean;
  sortOrder: number;
  updatedAt: Date;
}): ProjectNodeListItem {
  return {
    ...node,
    updatedAt: node.updatedAt.toISOString(),
  };
}

export async function getProjectTree(
  projectId: string,
): Promise<ProjectNodeListItem[]> {
  const { project } = await requireProjectReadAccess(projectId);
  const nodes = await prisma.projectNode.findMany({
    where: {
      projectId: project.id,
      status: "ACTIVE",
    },
    orderBy: [
      { type: "desc" },
      { sortOrder: "asc" },
      { name: "asc" },
      { id: "asc" },
    ],
    select: {
      id: true,
      projectId: true,
      parentId: true,
      name: true,
      type: true,
      language: true,
      isProtected: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  return nodes.map(serializeNode);
}

export async function getProjectNode(
  projectId: string,
  nodeId: string,
): Promise<ProjectNodeListItem> {
  const { project } = await requireProjectReadAccess(projectId);
  const node = await prisma.projectNode.findFirst({
    where: {
      id: nodeId,
      projectId: project.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      projectId: true,
      parentId: true,
      name: true,
      type: true,
      language: true,
      isProtected: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  if (!node) {
    throw new FileDomainError("NOT_FOUND", "This file is unavailable.");
  }

  return serializeNode(node);
}

export async function getFileContent(
  projectId: string,
  fileId: string,
): Promise<ProjectFileContent> {
  const { project } = await requireProjectReadAccess(projectId);
  const file = await prisma.projectNode.findFirst({
    where: {
      id: fileId,
      projectId: project.id,
      status: "ACTIVE",
      type: "FILE",
    },
    select: {
      id: true,
      name: true,
      content: true,
      language: true,
      updatedAt: true,
    },
  });

  if (!file) {
    throw new FileDomainError("NOT_FOUND", "This file is unavailable.");
  }

  return {
    id: file.id,
    name: file.name,
    content: file.content ?? "",
    language: file.language ?? "plaintext",
    updatedAt: file.updatedAt.toISOString(),
  };
}
