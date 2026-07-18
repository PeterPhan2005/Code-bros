"use client";

import { EditorTab } from "@/components/editor/editor-tab";
import type { EditorTab as EditorTabState } from "@/lib/editor/editor.types";

interface EditorTabsProps {
  tabs: EditorTabState[];
  onActivate: (fileId: string) => void;
  onClose: (fileId: string) => void;
}

export function EditorTabs({
  tabs,
  onActivate,
  onClose,
}: EditorTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex h-10 shrink-0 overflow-x-auto overflow-y-hidden border-b bg-card/30"
    >
      {tabs.map((tab) => (
        <EditorTab
          key={tab.fileId}
          tab={tab}
          onActivate={onActivate}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
