import { EditorShell } from "@/components/editor/editor-shell";

export default function Home() {
  return (
    <EditorShell>
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Editor canvas
      </div>
    </EditorShell>
  );
}
