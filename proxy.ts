import { clerkMiddleware } from "@clerk/nextjs/server";

import {
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
  isPublicAuthRoute,
} from "@/lib/auth/routes";

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicAuthRoute(request.nextUrl.pathname)) {
      await auth.protect();
    }
  },
  {
    signInUrl: SIGN_IN_ROUTE,
    signUpUrl: SIGN_UP_ROUTE,
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
