import { AppEditorWorkspace } from "@/components/editor/app-editor-workspace";
import { ProjectHome } from "@/components/projects/project-home";

export default function EditorPage() {
  return (
    <AppEditorWorkspace>
      <ProjectHome />
    </AppEditorWorkspace>
  );
}
