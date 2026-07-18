import { z } from "zod";

import {
  MAX_PROJECT_NODE_NAME_LENGTH,
  MAX_TEXT_FILE_SIZE_BYTES,
} from "@/lib/files/file.constants";

const identifierSchema = z
  .string({ error: "An ID is required." })
  .trim()
  .min(1, "An ID is required.");

const nodeNameSchema = z
  .string({ error: "Enter a name." })
  .trim()
  .min(1, "Enter a name.")
  .max(
    MAX_PROJECT_NODE_NAME_LENGTH,
    `Names must be ${MAX_PROJECT_NODE_NAME_LENGTH} characters or fewer.`,
  )
  .refine(
    (name) => /[^\p{Z}\p{C}]/u.test(name),
    "Enter a name with at least one visible character.",
  )
  .refine(
    (name) => name !== "." && name !== "..",
    "This name is reserved.",
  )
  .refine(
    (name) => !/[\/\\\u0000-\u001f\u007f]/u.test(name),
    "Names cannot contain slashes or control characters.",
  );

const optionalParentIdSchema = identifierSchema.nullish().transform(
  (value) => value ?? null,
);

export const createFileSchema = z
  .object({
    projectId: identifierSchema,
    parentId: optionalParentIdSchema,
    name: nodeNameSchema,
  })
  .strict();

export const createFolderSchema = createFileSchema;

export const renameNodeSchema = z
  .object({
    projectId: identifierSchema,
    nodeId: identifierSchema,
    name: nodeNameSchema,
  })
  .strict();

export const moveNodeSchema = z
  .object({
    projectId: identifierSchema,
    nodeId: identifierSchema,
    targetParentId: optionalParentIdSchema,
  })
  .strict();

export const deleteNodeSchema = z
  .object({
    projectId: identifierSchema,
    nodeId: identifierSchema,
  })
  .strict();

export const updateFileContentSchema = z
  .object({
    projectId: identifierSchema,
    fileId: identifierSchema,
    content: z
      .string({ error: "File content must be text." })
      .refine(
        (content) =>
          new TextEncoder().encode(content).byteLength <=
          MAX_TEXT_FILE_SIZE_BYTES,
        "Files must be 1 MB or smaller.",
      ),
  })
  .strict();

export const getFileContentSchema = z
  .object({
    projectId: identifierSchema,
    fileId: identifierSchema,
  })
  .strict();

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type RenameNodeInput = z.infer<typeof renameNodeSchema>;
export type MoveNodeInput = z.infer<typeof moveNodeSchema>;
export type DeleteNodeInput = z.infer<typeof deleteNodeSchema>;
export type UpdateFileContentInput = z.infer<
  typeof updateFileContentSchema
>;
