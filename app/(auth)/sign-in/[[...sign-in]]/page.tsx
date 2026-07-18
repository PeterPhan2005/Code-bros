import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  EDITOR_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
} from "@/lib/auth/routes";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect(EDITOR_ROUTE);
  }

  return (
    <SignIn
      path={SIGN_IN_ROUTE}
      routing="path"
      signUpUrl={SIGN_UP_ROUTE}
      fallbackRedirectUrl={EDITOR_ROUTE}
    />
  );
}
