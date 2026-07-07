import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getCurrentOrganizationId() {
  await getCurrentUser();

  return "demo-organization";
}
