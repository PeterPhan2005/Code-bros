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
        className="flex h-full min-h-0"
        aria-label="Loading project workspace"
        aria-busy="true"
      >
        <aside className="flex h-full w-[260px] shrink-0 flex-col border-r bg-card/20">
          <div className="space-y-2 border-b px-3 py-2.5">
            <Skeleton className="h-3 w-16 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
          <div className="space-y-2 px-3 py-3">
            <Skeleton className="h-7 w-full rounded-lg" />
            <Skeleton className="ml-4 h-7 w-[calc(100%-1rem)] rounded-lg" />
            <Skeleton className="h-7 w-4/5 rounded-lg" />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-3">
            <Skeleton className="mx-auto h-8 w-56 rounded-xl" />
            <Skeleton className="mx-auto h-4 w-80 max-w-full rounded-xl" />
          </div>
        </div>
      </div>
    </EditorShell>
  );
}
