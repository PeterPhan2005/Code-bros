import "server-only";

import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { prisma } from "@/lib/db/prisma";
import { requireProjectOwner } from "@/lib/projects/project-access";
import { ProjectDomainError } from "@/lib/projects/project-errors";
import type {
  CreateProjectInput,
  DeleteProjectInput,
  RenameProjectInput,
} from "@/lib/projects/project.schemas";
import { toProjectSlug } from "@/lib/projects/project-slug";

const MAX_SLUG_WRITE_ATTEMPTS = 5;

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function findAvailableProjectSlug(
  ownerId: string,
  projectName: string,
  excludeProjectId?: string,
) {
  const baseSlug = toProjectSlug(projectName);
  const existingProjects = await prisma.project.findMany({
    where: {
      ownerId,
      ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
      OR: [
        { slug: baseSlug },
        { slug: { startsWith: `${baseSlug}-` } },
      ],
    },
    select: { slug: true },
  });
  const occupiedSlugs = new Set(
    existingProjects.map(({ slug }) => slug),
  );

  if (!occupiedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (occupiedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

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

export async function createProject(input: CreateProjectInput) {
  const currentUser = await requireCurrentApplicationUser();

  for (let attempt = 0; attempt < MAX_SLUG_WRITE_ATTEMPTS; attempt += 1) {
    const slug = await findAvailableProjectSlug(
      currentUser.id,
      input.name,
    );

    try {
      return await prisma.$transaction(async (transaction) => {
        const project = await transaction.project.create({
          data: {
            name: input.name,
            slug,
            ownerId: currentUser.id,
            visibility: "PRIVATE",
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });

        await transaction.projectMember.create({
          data: {
            projectId: project.id,
            userId: currentUser.id,
            role: "OWNER",
          },
        });

        return project;
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  throw new ProjectDomainError(
    "CONFLICT",
    "A unique project URL could not be reserved. Try again.",
  );
}

export async function renameProject(input: RenameProjectInput) {
  const { project, currentUser } = await requireProjectOwner(
    input.projectId,
  );

  if (project.name === input.name) {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
    };
  }

  for (let attempt = 0; attempt < MAX_SLUG_WRITE_ATTEMPTS; attempt += 1) {
    const slug = await findAvailableProjectSlug(
      currentUser.id,
      input.name,
      project.id,
    );

    try {
      const result = await prisma.project.updateMany({
        where: {
          id: project.id,
          ownerId: currentUser.id,
          status: { not: "DELETED" },
        },
        data: {
          name: input.name,
          slug,
          updatedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        throw new ProjectDomainError(
          "NOT_FOUND",
          "This project is unavailable.",
        );
      }

      return {
        id: project.id,
        name: input.name,
        slug,
      };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  throw new ProjectDomainError(
    "CONFLICT",
    "A unique project URL could not be reserved. Try again.",
  );
}

export async function deleteProject(input: DeleteProjectInput) {
  const { project, currentUser } = await requireProjectOwner(
    input.projectId,
  );
  const result = await prisma.project.updateMany({
    where: {
      id: project.id,
      ownerId: currentUser.id,
      status: { not: "DELETED" },
    },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new ProjectDomainError(
      "NOT_FOUND",
      "This project is unavailable.",
    );
  }

  return { id: project.id };
}
