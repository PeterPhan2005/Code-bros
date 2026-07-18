"use client";

import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import type * as MonacoEditor from "monaco-editor";

import type { MonacoModelRegistry } from "@/lib/editor/monaco-model-registry";
import {
  CODE_BROS_MONACO_THEME,
  configureMonacoLanguageDefaults,
  defineCodeBrosMonacoTheme,
} from "@/lib/editor/monaco-theme";

let isMonacoConfigured = false;

export interface CodeEditorClientProps {
  fileId: string;
  fileName: string;
  content: string;
  language: string;
  readOnly: boolean;
  registry: MonacoModelRegistry;
  onChange: (fileId: string, value: string) => void;
  onSave: () => void;
  onCursorChange: (line: number, column: number) => void;
  onReady?: () => void;
}

const EDITOR_OPTIONS: MonacoEditor.editor.IStandaloneEditorConstructionOptions =
  {
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily:
      "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 14,
    lineHeight: 22,
    fontLigatures: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: "on",
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    wordWrap: "off",
    folding: true,
    renderWhitespace: "selection",
    renderLineHighlight: "line",
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    padding: {
      top: 12,
      bottom: 12,
    },
  };

export default function CodeEditorClient({
  fileId,
  fileName,
  content,
  language,
  readOnly,
  registry,
  onChange,
  onSave,
  onCursorChange,
  onReady,
}: CodeEditorClientProps) {
  const editorRef =
    useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const contentRef = useRef(content);
  const activeFileIdRef = useRef(fileId);
  const onSaveRef = useRef(onSave);
  const onChangeRef = useRef(onChange);
  const onCursorChangeRef = useRef(onCursorChange);
  const onReadyRef = useRef(onReady);
  const previousFileIdRef = useRef<string | null>(null);
  const saveActionRef = useRef<MonacoEditor.IDisposable | null>(null);
  const cursorSubscriptionRef =
    useRef<MonacoEditor.IDisposable | null>(null);

  useEffect(() => {
    contentRef.current = content;
    activeFileIdRef.current = fileId;
    onSaveRef.current = onSave;
    onChangeRef.current = onChange;
    onCursorChangeRef.current = onCursorChange;
    onReadyRef.current = onReady;
  }, [content, fileId, onChange, onCursorChange, onReady, onSave]);

  const activateModel = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const previousFileId = previousFileIdRef.current;

    if (previousFileId) {
      registry.saveViewState(previousFileId, editor.saveViewState());
    }

    const previousModel = editor.getModel();
    const { model, replacedModel } = registry.ensureModel(monaco, {
      fileId,
      fileName,
      content: contentRef.current,
      language,
    });

    if (editor.getModel() !== model) {
      editor.setModel(model);
    }

    editor.updateOptions({
      readOnly,
      domReadOnly: readOnly,
      ariaLabel: `Code editor for ${fileName}`,
    });
    editor.restoreViewState(registry.getViewState(fileId));
    const position = editor.getPosition();

    if (position) {
      onCursorChangeRef.current(
        position.lineNumber,
        position.column,
      );
    }

    editor.focus();
    previousFileIdRef.current = fileId;

    if (
      previousModel &&
      previousModel !== model &&
      previousModel.uri.scheme === "inmemory" &&
      !previousModel.isDisposed()
    ) {
      previousModel.dispose();
    }

    if (replacedModel && !replacedModel.isDisposed()) {
      replacedModel.dispose();
    }
  }, [fileId, fileName, language, readOnly, registry]);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    if (!isMonacoConfigured) {
      defineCodeBrosMonacoTheme(monaco);
      configureMonacoLanguageDefaults(monaco);
      isMonacoConfigured = true;
    }
  }, []);

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      activateModel();
      onReadyRef.current?.();

      saveActionRef.current = editor.addAction({
        id: "code-bros.save-file",
        label: "Save File",
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        ],
        run: () => {
          onSaveRef.current();
        },
      });
      cursorSubscriptionRef.current = editor.onDidChangeCursorPosition(
        ({ position }) => {
          onCursorChangeRef.current(
            position.lineNumber,
            position.column,
          );
        },
      );
    },
    [activateModel],
  );

  useEffect(() => {
    activateModel();
  }, [activateModel]);

  useEffect(() => {
    const model = editorRef.current?.getModel();

    if (
      model &&
      activeFileIdRef.current === fileId &&
      model.getValue() !== content
    ) {
      model.setValue(content);
    }
  }, [content, fileId]);

  useEffect(() => {
    return () => {
      const previousFileId = previousFileIdRef.current;
      const editor = editorRef.current;

      if (previousFileId && editor) {
        registry.saveViewState(previousFileId, editor.saveViewState());
      }

      saveActionRef.current?.dispose();
      cursorSubscriptionRef.current?.dispose();
    };
  }, [registry]);

  return (
    <Editor
      height="100%"
      width="100%"
      defaultValue=""
      defaultLanguage="plaintext"
      defaultPath="inmemory://code-bros/bootstrap"
      theme={CODE_BROS_MONACO_THEME}
      keepCurrentModel
      saveViewState={false}
      options={{
        ...EDITOR_OPTIONS,
        readOnly,
        domReadOnly: readOnly,
        ariaLabel: `Code editor for ${fileName}`,
      }}
      loading={
        <div
          className="flex h-full items-center justify-center text-sm text-muted-foreground"
          aria-busy="true"
        >
          Loading editor…
        </div>
      }
      wrapperProps={{
        id: "code-editor-canvas",
        "aria-label": `Code editor for ${fileName}`,
      }}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(value) => {
        onChangeRef.current(activeFileIdRef.current, value ?? "");
      }}
    />
  );
}
