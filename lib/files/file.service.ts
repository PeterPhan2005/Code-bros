import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MAX_TEXT_FILE_SIZE_BYTES } from "@/lib/files/file.constants";
import { FileDomainError } from "@/lib/files/file.errors";
import { detectFileType } from "@/lib/files/file-language";
import type {
  CreateFileInput,
  CreateFolderInput,
  DeleteNodeInput,
  MoveNodeInput,
  RenameNodeInput,
  UpdateFileContentInput,
} from "@/lib/files/file.schemas";
import type {
  FileMutationResult,
  ProjectNodeListItem,
} from "@/lib/files/file.types";
import { requireProjectWriteAccess } from "@/lib/projects/project-access";

type TransactionClient = Prisma.TransactionClient;
const MAX_TRANSACTION_ATTEMPTS = 3;

const nodeListSelect = {
  id: true,
  projectId: true,
  parentId: true,
  name: true,
  type: true,
  language: true,
  isProtected: true,
  sortOrder: true,
  updatedAt: true,
} as const;

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

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function isTransactionConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

async function runStructuralTransaction<T>(
  operation: (transaction: TransactionClient) => Promise<T>,
) {
  for (
    let attempt = 0;
    attempt < MAX_TRANSACTION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (
        !isTransactionConflict(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS - 1
      ) {
        throw error;
      }
    }
  }

  throw new FileDomainError(
    "CONFLICT",
    "The file system changed at the same time. Try again.",
  );
}

async function runWithSiblingCollisionGuard<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new FileDomainError(
        "CONFLICT",
        "A file or folder with this name already exists.",
      );
    }

    throw error;
  }
}

async function getActiveNode(
  transaction: TransactionClient,
  projectId: string,
  nodeId: string,
) {
  const node = await transaction.projectNode.findFirst({
    where: {
      id: nodeId,
      projectId,
      status: "ACTIVE",
    },
  });

  if (!node) {
    throw new FileDomainError("NOT_FOUND", "This file is unavailable.");
  }

  return node;
}

async function validateParent(
  transaction: TransactionClient,
  projectId: string,
  parentId: string | null,
) {
  if (!parentId) {
    return null;
  }

  const parent = await transaction.projectNode.findFirst({
    where: {
      id: parentId,
      projectId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      parentId: true,
      type: true,
    },
  });

  if (!parent || parent.type !== "FOLDER") {
    throw new FileDomainError(
      "INVALID_PARENT",
      "The selected destination is invalid.",
    );
  }

  return parent;
}

async function ensureSiblingNameAvailable(
  transaction: TransactionClient,
  projectId: string,
  parentId: string | null,
  name: string,
  excludeNodeId?: string,
) {
  const conflict = await transaction.projectNode.findFirst({
    where: {
      projectId,
      parentId,
      status: "ACTIVE",
      ...(excludeNodeId ? { id: { not: excludeNodeId } } : {}),
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new FileDomainError(
      "CONFLICT",
      "A file or folder with this name already exists.",
    );
  }
}

async function ensureValidMoveTarget(
  transaction: TransactionClient,
  projectId: string,
  nodeId: string,
  nodeType: "FILE" | "FOLDER",
  targetParentId: string | null,
) {
  const targetParent = await validateParent(
    transaction,
    projectId,
    targetParentId,
  );

  if (nodeType !== "FOLDER" || !targetParent) {
    return;
  }

  if (targetParent.id === nodeId) {
    throw new FileDomainError(
      "CYCLE",
      "A folder cannot be moved into itself.",
    );
  }

  const visited = new Set<string>();
  let ancestorId: string | null = targetParent.parentId;

  while (ancestorId) {
    if (ancestorId === nodeId) {
      throw new FileDomainError(
        "CYCLE",
        "A folder cannot be moved into one of its descendants.",
      );
    }

    if (visited.has(ancestorId)) {
      throw new FileDomainError(
        "INVALID_PARENT",
        "The selected destination is invalid.",
      );
    }

    visited.add(ancestorId);
    const ancestor: { parentId: string | null } | null =
      await transaction.projectNode.findFirst({
        where: {
          id: ancestorId,
          projectId,
          status: "ACTIVE",
          type: "FOLDER",
        },
        select: { parentId: true },
      });

    if (!ancestor) {
      throw new FileDomainError(
        "INVALID_PARENT",
        "The selected destination is invalid.",
      );
    }

    ancestorId = ancestor.parentId;
  }
}

async function touchActiveProject(
  transaction: TransactionClient,
  projectId: string,
) {
  const result = await transaction.project.updateMany({
    where: {
      id: projectId,
      status: { not: "DELETED" },
    },
    data: {
      updatedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new FileDomainError("NOT_FOUND", "This project is unavailable.");
  }
}

export async function createFile(
  input: CreateFileInput,
): Promise<FileMutationResult> {
  const { project, currentUser } = await requireProjectWriteAccess(
    input.projectId,
  );

  return runWithSiblingCollisionGuard(() =>
    runStructuralTransaction(async (transaction) => {
      await validateParent(transaction, project.id, input.parentId);
      await ensureSiblingNameAvailable(
        transaction,
        project.id,
        input.parentId,
        input.name,
      );

      const fileType = detectFileType(input.name);
      const node = await transaction.projectNode.create({
        data: {
          projectId: project.id,
          parentId: input.parentId,
          name: input.name,
          type: "FILE",
          status: "ACTIVE",
          content: "",
          language: fileType.language,
          mimeType: fileType.mimeType,
          createdById: currentUser.id,
        },
        select: nodeListSelect,
      });

      await touchActiveProject(transaction, project.id);

      return {
        node: serializeNode(node),
        event: "file-created" as const,
      };
    }),
  );
}

export async function createFolder(
  input: CreateFolderInput,
): Promise<FileMutationResult> {
  const { project, currentUser } = await requireProjectWriteAccess(
    input.projectId,
  );

  return runWithSiblingCollisionGuard(() =>
    runStructuralTransaction(async (transaction) => {
      await validateParent(transaction, project.id, input.parentId);
      await ensureSiblingNameAvailable(
        transaction,
        project.id,
        input.parentId,
        input.name,
      );

      const node = await transaction.projectNode.create({
        data: {
          projectId: project.id,
          parentId: input.parentId,
          name: input.name,
          type: "FOLDER",
          status: "ACTIVE",
          content: null,
          language: null,
          mimeType: null,
          createdById: currentUser.id,
        },
        select: nodeListSelect,
      });

      await touchActiveProject(transaction, project.id);

      return {
        node: serializeNode(node),
        event: "folder-created" as const,
      };
    }),
  );
}

export async function renameNode(
  input: RenameNodeInput,
): Promise<FileMutationResult> {
  const { project, currentUser } = await requireProjectWriteAccess(
    input.projectId,
  );

  return runWithSiblingCollisionGuard(() =>
    runStructuralTransaction(async (transaction) => {
      const currentNode = await getActiveNode(
        transaction,
        project.id,
        input.nodeId,
      );

      if (currentNode.isProtected) {
        throw new FileDomainError(
          "PROTECTED",
          "This protected item cannot be renamed.",
        );
      }

      if (currentNode.name === input.name) {
        return {
          node: serializeNode(currentNode),
          event: "node-renamed" as const,
        };
      }

      await ensureSiblingNameAvailable(
        transaction,
        project.id,
        currentNode.parentId,
        input.name,
        currentNode.id,
      );

      const fileType =
        currentNode.type === "FILE" ? detectFileType(input.name) : null;
      const node = await transaction.projectNode.update({
        where: { id: currentNode.id },
        data: {
          name: input.name,
          updatedById: currentUser.id,
          ...(fileType
            ? {
                language: fileType.language,
                mimeType: fileType.mimeType,
              }
            : {}),
        },
        select: nodeListSelect,
      });

      await touchActiveProject(transaction, project.id);

      return {
        node: serializeNode(node),
        event: "node-renamed" as const,
      };
    }),
  );
}

export async function moveNode(
  input: MoveNodeInput,
): Promise<FileMutationResult> {
  const { project, currentUser } = await requireProjectWriteAccess(
    input.projectId,
  );

  return runWithSiblingCollisionGuard(() =>
    runStructuralTransaction(async (transaction) => {
      const currentNode = await getActiveNode(
        transaction,
        project.id,
        input.nodeId,
      );

      if (currentNode.isProtected) {
        throw new FileDomainError(
          "PROTECTED",
          "This protected item cannot be moved.",
        );
      }

      await ensureValidMoveTarget(
        transaction,
        project.id,
        currentNode.id,
        currentNode.type,
        input.targetParentId,
      );

      if (currentNode.parentId === input.targetParentId) {
        return {
          node: serializeNode(currentNode),
          event: "node-moved" as const,
        };
      }

      await ensureSiblingNameAvailable(
        transaction,
        project.id,
        input.targetParentId,
        currentNode.name,
        currentNode.id,
      );

      const node = await transaction.projectNode.update({
        where: { id: currentNode.id },
        data: {
          parentId: input.targetParentId,
          updatedById: currentUser.id,
        },
        select: nodeListSelect,
      });

      await touchActiveProject(transaction, project.id);

      return {
        node: serializeNode(node),
        event: "node-moved" as const,
      };
    }),
  );
}

function collectSubtreeIds(
  nodes: Array<{
    id: string;
    parentId: string | null;
    isProtected: boolean;
  }>,
  rootId: string,
) {
  const childrenByParent = new Map<string, string[]>();
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    if (!node.parentId) {
      continue;
    }

    const childIds = childrenByParent.get(node.parentId) ?? [];
    childIds.push(node.id);
    childrenByParent.set(node.parentId, childIds);
  }

  const subtreeIds: string[] = [];
  const visited = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId || visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);
    subtreeIds.push(currentId);
    queue.push(...(childrenByParent.get(currentId) ?? []));
  }

  return {
    subtreeIds,
    containsProtectedNode: subtreeIds.some(
      (id) => nodesById.get(id)?.isProtected,
    ),
  };
}

export async function deleteNode(
  input: DeleteNodeInput,
): Promise<FileMutationResult> {
  const { project, currentUser } = await requireProjectWriteAccess(
    input.projectId,
  );

  return runStructuralTransaction(async (transaction) => {
    const currentNode = await getActiveNode(
      transaction,
      project.id,
      input.nodeId,
    );
    const activeNodes = await transaction.projectNode.findMany({
      where: {
        projectId: project.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        parentId: true,
        isProtected: true,
      },
    });
    const { subtreeIds, containsProtectedNode } = collectSubtreeIds(
      activeNodes,
      currentNode.id,
    );

    if (containsProtectedNode) {
      throw new FileDomainError(
        "PROTECTED",
        currentNode.type === "FOLDER"
          ? "This folder contains protected files and cannot be deleted."
          : "This protected file cannot be deleted.",
      );
    }

    const deletedAt = new Date();
    await transaction.projectNode.updateMany({
      where: {
        id: { in: subtreeIds },
        projectId: project.id,
        status: "ACTIVE",
      },
      data: {
        status: "DELETED",
        deletedAt,
        updatedById: currentUser.id,
      },
    });

    await touchActiveProject(transaction, project.id);

    return {
      node: serializeNode(currentNode),
      event: "node-deleted" as const,
    };
  });
}

export async function updateFileContent(
  input: UpdateFileContentInput,
): Promise<FileMutationResult> {
  const { project, currentUser } = await requireProjectWriteAccess(
    input.projectId,
  );
  const contentSize = new TextEncoder().encode(input.content).byteLength;

  if (contentSize > MAX_TEXT_FILE_SIZE_BYTES) {
    throw new FileDomainError(
      "TOO_LARGE",
      "Files must be 1 MB or smaller.",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const currentNode = await getActiveNode(
      transaction,
      project.id,
      input.fileId,
    );

    if (currentNode.type !== "FILE") {
      throw new FileDomainError("NOT_FOUND", "This file is unavailable.");
    }

    const node = await transaction.projectNode.update({
      where: { id: currentNode.id },
      data: {
        content: input.content,
        updatedById: currentUser.id,
      },
      select: nodeListSelect,
    });

    await touchActiveProject(transaction, project.id);

    return {
      node: serializeNode(node),
      event: "file-updated" as const,
    };
  });
}
