"use server";

import { signIn } from "@/../auth";

export async function signInWithCredentials(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
}
