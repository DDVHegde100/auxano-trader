import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { verifyDevToken, devAuthEnabled } from "@/lib/dev-session";

export async function getSessionClerkId(): Promise<string | null> {
  if (devAuthEnabled()) {
    const token = (await cookies()).get("auxano_dev_token")?.value;
    if (token) {
      const clerkId = verifyDevToken(token);
      if (clerkId) return clerkId;
    }
  }

  const session = await auth();
  return session.userId;
}
