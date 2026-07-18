import "server-only";

import type { Prisma } from "@/generated/prisma/client";

interface CreateStarterProjectNodesInput {
  projectId: string;
  projectName: string;
  creatorId: string;
}

export async function createStarterProjectNodes(
  transaction: Prisma.TransactionClient,
  input: CreateStarterProjectNodesInput,
) {
  const sourceFolder = await transaction.projectNode.create({
    data: {
      projectId: input.projectId,
      parentId: null,
      name: "src",
      type: "FOLDER",
      content: null,
      language: null,
      mimeType: null,
      sortOrder: 0,
      createdById: input.creatorId,
    },
    select: { id: true },
  });

  await transaction.projectNode.createMany({
    data: [
      {
        projectId: input.projectId,
        parentId: sourceFolder.id,
        name: "index.ts",
        type: "FILE",
        content: 'console.log("Welcome to Code Bros");\n',
        language: "typescript",
        mimeType: "text/typescript",
        sortOrder: 0,
        createdById: input.creatorId,
      },
      {
        projectId: input.projectId,
        parentId: null,
        name: "package.json",
        type: "FILE",
        content: `${JSON.stringify(
          {
            name: "code-bros-project",
            private: true,
            scripts: {
              start: "tsx src/index.ts",
            },
          },
          null,
          2,
        )}\n`,
        language: "json",
        mimeType: "application/json",
        isProtected: true,
        sortOrder: 0,
        createdById: input.creatorId,
      },
      {
        projectId: input.projectId,
        parentId: null,
        name: "README.md",
        type: "FILE",
        content: `# ${input.projectName}\n\nBuilt collaboratively with Code Bros.\n`,
        language: "markdown",
        mimeType: "text/markdown",
        sortOrder: 1,
        createdById: input.creatorId,
      },
    ],
  });
}
