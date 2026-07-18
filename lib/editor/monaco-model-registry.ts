import type * as MonacoEditor from "monaco-editor";

import { createMonacoFileUri } from "@/lib/editor/monaco-uri";

interface ModelDescriptor {
  fileId: string;
  fileName: string;
  content: string;
  language: string;
}

interface ModelEntry {
  model: MonacoEditor.editor.ITextModel;
  uri: string;
}

export interface EnsuredModel {
  model: MonacoEditor.editor.ITextModel;
  replacedModel: MonacoEditor.editor.ITextModel | null;
}

export class MonacoModelRegistry {
  private readonly models = new Map<string, ModelEntry>();
  private readonly viewStates = new Map<
    string,
    MonacoEditor.editor.ICodeEditorViewState
  >();

  constructor(private readonly projectId: string) {}

  ensureModel(
    monaco: typeof MonacoEditor,
    descriptor: ModelDescriptor,
  ): EnsuredModel {
    const uri = createMonacoFileUri(
      this.projectId,
      descriptor.fileId,
      descriptor.fileName,
    );
    const existing = this.models.get(descriptor.fileId);

    if (existing?.uri === uri && !existing.model.isDisposed()) {
      if (existing.model.getLanguageId() !== descriptor.language) {
        monaco.editor.setModelLanguage(existing.model, descriptor.language);
      }

      return { model: existing.model, replacedModel: null };
    }

    const resource = monaco.Uri.parse(uri);
    const model =
      monaco.editor.getModel(resource) ??
      monaco.editor.createModel(
        existing?.model.getValue() ?? descriptor.content,
        descriptor.language,
        resource,
      );
    const replacedModel =
      existing && existing.model !== model ? existing.model : null;

    this.models.set(descriptor.fileId, { model, uri });
    return { model, replacedModel };
  }

  saveViewState(
    fileId: string,
    viewState: MonacoEditor.editor.ICodeEditorViewState | null,
  ) {
    if (viewState) {
      this.viewStates.set(fileId, viewState);
    }
  }

  getViewState(fileId: string) {
    return this.viewStates.get(fileId) ?? null;
  }

  dispose(fileId: string) {
    const entry = this.models.get(fileId);

    if (entry && !entry.model.isDisposed()) {
      entry.model.dispose();
    }

    this.models.delete(fileId);
    this.viewStates.delete(fileId);
  }

  disposeExcept(fileIds: Iterable<string>) {
    const retainedIds = new Set(fileIds);

    for (const fileId of this.models.keys()) {
      if (!retainedIds.has(fileId)) {
        this.dispose(fileId);
      }
    }
  }

  disposeAll() {
    for (const fileId of this.models.keys()) {
      this.dispose(fileId);
    }
  }
}
