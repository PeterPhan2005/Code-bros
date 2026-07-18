"use client";

import { useEffect } from "react";

import {
  EDITOR_NAVIGATION_REQUEST_EVENT,
  type EditorNavigationRequestDetail,
} from "@/lib/editor/unsaved-navigation";

export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  onNavigationRequest?: (href: string) => void,
) {
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    function handleNavigationRequest(event: Event) {
      const navigationEvent =
        event as CustomEvent<EditorNavigationRequestDetail>;
      event.preventDefault();
      onNavigationRequest?.(navigationEvent.detail.href);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener(
      EDITOR_NAVIGATION_REQUEST_EVENT,
      handleNavigationRequest,
    );
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener(
        EDITOR_NAVIGATION_REQUEST_EVENT,
        handleNavigationRequest,
      );
    };
  }, [hasUnsavedChanges, onNavigationRequest]);
}
