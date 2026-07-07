import { redirect } from "next/navigation";

import { auth } from "@/../auth";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return session.user;
}
