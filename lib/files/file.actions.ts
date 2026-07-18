"use server";

import { revalidatePath } from "next/cache";

import { FileDomainError } from "@/lib/files/file.errors";
import { getFileContent } from "@/lib/files/file.queries";
import {
  createFileSchema,
  createFolderSchema,
  deleteNodeSchema,
  getFileContentSchema,
  moveNodeSchema,
  renameNodeSchema,
  updateFileContentSchema,
} from "@/lib/files/file.schemas";
import {
  createFile,
  createFolder,
  deleteNode,
  moveNode,
  renameNode,
  updateFileContent,
} from "@/lib/files/file.service";
import type {
  ProjectFileContent,
  ProjectNodeListItem,
} from "@/lib/files/file.types";
import { ProjectDomainError } from "@/lib/projects/project-errors";
import type { ActionResult } from "@/lib/projects/project.types";

function mutationFailure(error: unknown, fallbackMessage: string) {
  if (
    error instanceof FileDomainError ||
    error instanceof ProjectDomainError
  ) {
    return error.message;
  }

  return fallbackMessage;
}

function revalidateWorkspace(projectId: string) {
  revalidatePath(`/editor/${projectId}`);
  revalidatePath("/editor");
}

export async function createFileAction(
  input: unknown,
): Promise<ActionResult<{ node: ProjectNodeListItem }>> {
  const parsedInput = createFileSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "Check the file name and try again.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await createFile(parsedInput.data);
    revalidateWorkspace(parsedInput.data.projectId);

    return { success: true, data: { node: result.node } };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The file could not be created. Try again.",
      ),
    };
  }
}

export async function createFolderAction(
  input: unknown,
): Promise<ActionResult<{ node: ProjectNodeListItem }>> {
  const parsedInput = createFolderSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "Check the folder name and try again.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await createFolder(parsedInput.data);
    revalidateWorkspace(parsedInput.data.projectId);

    return { success: true, data: { node: result.node } };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The folder could not be created. Try again.",
      ),
    };
  }
}

export async function renameNodeAction(
  input: unknown,
): Promise<ActionResult<{ node: ProjectNodeListItem }>> {
  const parsedInput = renameNodeSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "Check the name and try again.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await renameNode(parsedInput.data);
    revalidateWorkspace(parsedInput.data.projectId);

    return { success: true, data: { node: result.node } };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "This item could not be renamed. Try again.",
      ),
    };
  }
}

export async function moveNodeAction(
  input: unknown,
): Promise<ActionResult<{ node: ProjectNodeListItem }>> {
  const parsedInput = moveNodeSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "The selected destination is invalid.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await moveNode(parsedInput.data);
    revalidateWorkspace(parsedInput.data.projectId);

    return { success: true, data: { node: result.node } };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "This item could not be moved. Try again.",
      ),
    };
  }
}

export async function deleteNodeAction(
  input: unknown,
): Promise<ActionResult<{ nodeId: string }>> {
  const parsedInput = deleteNodeSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "This item could not be identified.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await deleteNode(parsedInput.data);
    revalidateWorkspace(parsedInput.data.projectId);

    return { success: true, data: { nodeId: result.node.id } };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "This item could not be deleted. Try again.",
      ),
    };
  }
}

export async function updateFileContentAction(
  input: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  const parsedInput = updateFileContentSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "Check the file content and try again.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await updateFileContent(parsedInput.data);

    return {
      success: true,
      data: { updatedAt: result.node.updatedAt },
    };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The file could not be saved. Try again.",
      ),
    };
  }
}

export async function getFileContentAction(
  input: unknown,
): Promise<ActionResult<ProjectFileContent>> {
  const parsedInput = getFileContentSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: "This file could not be identified.",
    };
  }

  try {
    const file = await getFileContent(
      parsedInput.data.projectId,
      parsedInput.data.fileId,
    );

    return { success: true, data: file };
  } catch (error) {
    return {
      success: false,
      error: mutationFailure(
        error,
        "The file could not be opened. Try again.",
      ),
    };
  }
}
