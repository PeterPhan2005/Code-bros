import type { ReactNode } from "react";

import { AuthLayoutContent } from "@/components/auth/auth-layout-content";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthLayoutContent>{children}</AuthLayoutContent>;
}
