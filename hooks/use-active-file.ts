"use client";

import { useCallback, useState } from "react";

export function useActiveFile() {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const selectFile = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  const clearActiveFile = useCallback(() => {
    setActiveFileId(null);
  }, []);

  return {
    activeFileId,
    selectFile,
    clearActiveFile,
  };
}
