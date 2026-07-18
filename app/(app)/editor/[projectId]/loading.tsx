import { EditorShell } from "@/components/editor/editor-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <EditorShell
      ownedProjects={[]}
      sharedProjects={[]}
      projectsLoading
    >
      <div
        className="flex h-full items-center justify-center px-6"
        aria-label="Loading project workspace"
        aria-busy="true"
      >
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="mx-auto h-8 w-56 rounded-xl" />
          <Skeleton className="mx-auto h-4 w-80 max-w-full rounded-xl" />
        </div>
      </div>
    </EditorShell>
  );
}
