import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EDITOR_ROUTE, SIGN_IN_ROUTE } from "@/lib/auth/routes";

export default async function Home() {
  const { userId } = await auth();

  redirect(userId ? EDITOR_ROUTE : SIGN_IN_ROUTE);
}
