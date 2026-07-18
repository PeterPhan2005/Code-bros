import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";

interface ProtectedAppLayoutProps {
  children: ReactNode;
}

export default async function ProtectedAppLayout({
  children,
}: ProtectedAppLayoutProps) {
  await auth.protect();

  return children;
}
