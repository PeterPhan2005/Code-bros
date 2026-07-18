import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { ProjectHome } from "@/components/projects/project-home";

export default function EditorPage() {
  return (
    <EditorWorkspace>
      <ProjectHome />
    </EditorWorkspace>
  );
}
