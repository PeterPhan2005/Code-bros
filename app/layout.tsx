import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { clerkAppearance } from "@/lib/auth/appearance";
import {
  EDITOR_ROUTE,
  POST_SIGN_OUT_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
} from "@/lib/auth/routes";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Code Bros",
  description: "Build with an AI live coding collaborator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          appearance={clerkAppearance}
          signInUrl={SIGN_IN_ROUTE}
          signUpUrl={SIGN_UP_ROUTE}
          signInFallbackRedirectUrl={EDITOR_ROUTE}
          signUpFallbackRedirectUrl={EDITOR_ROUTE}
          afterSignOutUrl={POST_SIGN_OUT_ROUTE}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
