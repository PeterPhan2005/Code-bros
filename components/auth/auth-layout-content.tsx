import type { ReactNode } from "react";

interface AuthLayoutContentProps {
  children: ReactNode;
}

function CodeBrosWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex items-center justify-center gap-2"
          : "flex items-center gap-3"
      }
    >
      <span className="flex size-9 items-center justify-center rounded-xl border bg-muted text-xs font-semibold">
        CB
      </span>
      <span className="font-heading text-sm font-semibold">Code Bros</span>
    </div>
  );
}

export function AuthLayoutContent({ children }: AuthLayoutContentProps) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <aside className="hidden border-r bg-card lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <CodeBrosWordmark />

        <div className="max-w-lg">
          <p className="font-heading text-3xl font-semibold tracking-tight">
            Build alongside your team and Code Bro.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            One shared workspace for collaborative coding, visible AI help, and
            reviewable engineering decisions.
          </p>

          <ul className="mt-8 space-y-3 border-l pl-4 text-sm text-muted-foreground">
            <li>Build together in real time.</li>
            <li>Review AI-proposed code changes before they apply.</li>
            <li>Keep engineering decisions visible to the whole room.</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          AI collaboration that stays visible and reviewable.
        </p>
      </aside>

      <main className="flex min-w-0 items-center justify-center overflow-y-auto px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <CodeBrosWordmark compact />
          </div>
          <div className="flex justify-center">{children}</div>
        </div>
      </main>
    </div>
  );
}
