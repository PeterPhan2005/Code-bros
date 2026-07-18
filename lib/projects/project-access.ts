import "server-only";

import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { prisma } from "@/lib/db/prisma";
import { ProjectDomainError } from "@/lib/projects/project-errors";
import { projectIdentifierSchema } from "@/lib/projects/project.schemas";
import type { ProjectRole } from "@/lib/projects/project.types";

async function requireCurrentApplicationUser() {
  try {
    return await getOrCreateCurrentUser();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication is required."
    ) {
      throw new ProjectDomainError(
        "UNAUTHENTICATED",
        "Sign in to manage projects.",
      );
    }

    throw error;
  }
}

export async function getProjectAccess(projectId: string) {
  const parsedProjectId = projectIdentifierSchema.safeParse(projectId);

  if (!parsedProjectId.success) {
    return null;
  }

  const currentUser = await requireCurrentApplicationUser();
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
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      ownerId: project.ownerId,
    },
    currentUser,
    ownership: isOwner ? ("owned" as const) : ("shared" as const),
    role: role as ProjectRole,
  };
}

export async function requireProjectAccess(projectId: string) {
  const access = await getProjectAccess(projectId);

  if (!access) {
    throw new ProjectDomainError(
      "NOT_FOUND",
      "This project is unavailable.",
    );
  }

  return access;
}

export async function requireProjectOwner(projectId: string) {
  const parsedProjectId = projectIdentifierSchema.safeParse(projectId);

  if (!parsedProjectId.success) {
    throw new ProjectDomainError(
      "NOT_FOUND",
      "This project is unavailable.",
    );
  }

  const currentUser = await requireCurrentApplicationUser();
  const project = await prisma.project.findFirst({
    where: {
      id: parsedProjectId.data,
      ownerId: currentUser.id,
      status: { not: "DELETED" },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!project) {
    throw new ProjectDomainError(
      "NOT_FOUND",
      "This project is unavailable.",
    );
  }

  return { project, currentUser };
}
