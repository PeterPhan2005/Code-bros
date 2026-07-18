export const EDITOR_NAVIGATION_REQUEST_EVENT =
  "code-bros:editor-navigation-request";

export interface EditorNavigationRequestDetail {
  href: string;
}

export function requestEditorNavigation(href: string) {
  if (typeof window === "undefined") {
    return true;
  }

  return window.dispatchEvent(
    new CustomEvent<EditorNavigationRequestDetail>(
      EDITOR_NAVIGATION_REQUEST_EVENT,
      {
        cancelable: true,
        detail: { href },
      },
    ),
  );
}
