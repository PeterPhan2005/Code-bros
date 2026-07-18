import { z } from "zod";

const projectNameSchema = z
  .string({ error: "Enter a project name." })
  .trim()
  .min(1, "Enter a project name.")
  .max(80, "Project names must be 80 characters or fewer.")
  .refine(
    (name) => /[^\p{Z}\p{C}]/u.test(name),
    "Enter a project name with at least one visible character.",
  );

const projectIdSchema = z
  .string({ error: "A project ID is required." })
  .trim()
  .min(1, "A project ID is required.");

export const createProjectSchema = z
  .object({
    name: projectNameSchema,
  })
  .strict();

export const renameProjectSchema = z
  .object({
    projectId: projectIdSchema,
    name: projectNameSchema,
  })
  .strict();

export const deleteProjectSchema = z
  .object({
    projectId: projectIdSchema,
  })
  .strict();

export const projectIdentifierSchema = projectIdSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type RenameProjectInput = z.infer<typeof renameProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
