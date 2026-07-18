import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";

export async function getOrCreateCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication is required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.emailAddresses.find(
      ({ id }) => id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? null;

  return prisma.user.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      email: primaryEmail,
      displayName: clerkUser?.fullName ?? clerkUser?.username ?? null,
      imageUrl: clerkUser?.imageUrl ?? null,
    },
    update: {},
  });
}
