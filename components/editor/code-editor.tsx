"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import type { CodeEditorClientProps } from "@/components/editor/code-editor-client";

const MonacoEditorClient = dynamic(
  () => import("@/components/editor/code-editor-client"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full items-center justify-center text-sm text-muted-foreground"
        aria-busy="true"
      >
        Loading editor…
      </div>
    ),
  },
);

interface EditorErrorBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
}

class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): EditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    void _error;
    void _info;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <p className="font-medium">
              The code editor could not be loaded.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your saved files are unchanged.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl"
              onClick={this.props.onRetry}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function CodeEditor(props: CodeEditorClientProps) {
  const [retryKey, setRetryKey] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (isReady) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setHasTimedOut(true);
    }, 15_000);

    return () => window.clearTimeout(timeout);
  }, [isReady, retryKey]);

  function retryEditor() {
    setIsReady(false);
    setHasTimedOut(false);
    setRetryKey((key) => key + 1);
  }

  return (
    <EditorErrorBoundary
      key={retryKey}
      onRetry={retryEditor}
    >
      <div className="relative h-full">
        <MonacoEditorClient
          key={retryKey}
          {...props}
          onReady={() => {
            setIsReady(true);
            setHasTimedOut(false);
          }}
        />
        {hasTimedOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background px-6">
            <div className="max-w-sm text-center">
              <p className="font-medium">
                The code editor could not be loaded.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl"
                onClick={retryEditor}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </EditorErrorBoundary>
  );
}
