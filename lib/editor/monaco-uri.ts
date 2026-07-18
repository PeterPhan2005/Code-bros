export function createMonacoFileUri(
  projectId: string,
  fileId: string,
  fileName: string,
) {
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedFileId = encodeURIComponent(fileId);
  const encodedFileName = encodeURIComponent(fileName);

  return `file:///projects/${encodedProjectId}/${encodedFileId}/${encodedFileName}`;
}
