"use server";

import { revalidatePath } from "next/cache";

import { ProjectDomainError } from "@/lib/projects/project-errors";
import {
  createProjectSchema,
  deleteProjectSchema,
  renameProjectSchema,
} from "@/lib/projects/project.schemas";
import {
  createProject as createProjectInDatabase,
  deleteProject as deleteProjectInDatabase,
  renameProject as renameProjectInDatabase,
} from "@/lib/projects/project.service";
import type { ActionResult } from "@/lib/projects/project.types";

function mutationFailure(error: unknown, fallbackMessage: string) {
  if (error instanceof ProjectDomainError) {
    return error.message;
  }

  return fallbackMessage;
}

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  const parsedInput = createProjectSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "Check the project name and try again.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const project = await createProjectInDatabase(parsedInput.data);
    revalidatePath("/editor");

    return {
      success: true,
      data: { projectId: project.id },
    };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The project could not be created. Try again.",
      ),
    };
  }
}

export async function renameProject(
  input: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  const parsedInput = renameProjectSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "Check the project name and try again.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const project = await renameProjectInDatabase(parsedInput.data);
    revalidatePath("/editor");
    revalidatePath(`/editor/${project.id}`);

    return {
      success: true,
      data: { projectId: project.id },
    };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The project could not be renamed. Try again.",
      ),
    };
  }
}

export async function deleteProject(
  input: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  const parsedInput = deleteProjectSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "The project could not be identified.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const project = await deleteProjectInDatabase(parsedInput.data);
    revalidatePath("/editor");
    revalidatePath(`/editor/${project.id}`);

    return {
      success: true,
      data: { projectId: project.id },
    };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The project could not be deleted. Try again.",
      ),
    };
  }
}
