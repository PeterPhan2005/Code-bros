import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  EDITOR_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
} from "@/lib/auth/routes";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect(EDITOR_ROUTE);
  }

  return (
    <SignUp
      path={SIGN_UP_ROUTE}
      routing="path"
      signInUrl={SIGN_IN_ROUTE}
      fallbackRedirectUrl={EDITOR_ROUTE}
    />
  );
}
