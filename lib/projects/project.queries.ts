import "server-only";

import { cache } from "react";

import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { prisma } from "@/lib/db/prisma";
import { projectIdentifierSchema } from "@/lib/projects/project.schemas";
import type {
  AccessibleProject,
  ProjectListItem,
  ProjectLists,
  ProjectRole,
} from "@/lib/projects/project.types";

const getCurrentApplicationUser = cache(getOrCreateCurrentUser);

function serializeOwnedProject(project: {
  id: string;
  name: string;
  slug: string;
  updatedAt: Date;
}): ProjectListItem {
  return {
    ...project,
    updatedAt: project.updatedAt.toISOString(),
    ownership: "owned",
    role: "OWNER",
  };
}

export async function getOwnedProjects(): Promise<ProjectListItem[]> {
  const currentUser = await getCurrentApplicationUser();
  const projects = await prisma.project.findMany({
    where: {
      ownerId: currentUser.id,
      status: { not: "DELETED" },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });

  return projects.map(serializeOwnedProject);
}

export async function getSharedProjects(): Promise<ProjectListItem[]> {
  const currentUser = await getCurrentApplicationUser();
  const memberships = await prisma.projectMember.findMany({
    where: {
      userId: currentUser.id,
      project: {
        ownerId: { not: currentUser.id },
        status: { not: "DELETED" },
      },
    },
    orderBy: [{ project: { updatedAt: "desc" } }, { projectId: "asc" }],
    select: {
      role: true,
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          updatedAt: true,
        },
      },
    },
  });

  return memberships.map(({ project, role }) => ({
    ...project,
    updatedAt: project.updatedAt.toISOString(),
    ownership: "shared",
    role: role as ProjectRole,
  }));
}

export async function getProjectLists(): Promise<ProjectLists> {
  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return { ownedProjects, sharedProjects };
}

export async function getAccessibleProjectById(
  projectId: string,
): Promise<AccessibleProject | null> {
  const parsedProjectId = projectIdentifierSchema.safeParse(projectId);

  if (!parsedProjectId.success) {
    return null;
  }

  const currentUser = await getCurrentApplicationUser();
  const project = await prisma.project.findFirst({
    where: {
      id: parsedProjectId.data,
      status: { not: "DELETED" },
      OR: [
        { ownerId: currentUser.id },
        { members: { some: { userId: currentUser.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      members: {
        where: { userId: currentUser.id },
        take: 1,
        select: { role: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  const isOwner = project.ownerId === currentUser.id;
  const role = isOwner ? "OWNER" : project.members[0]?.role;

  if (!role) {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    ownership: isOwner ? "owned" : "shared",
    role: role as ProjectRole,
  };
}
