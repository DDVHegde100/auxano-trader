import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/services/friends";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const viewer = await getOrCreateDbUser(req);
  const profile = await getUserProfile(username, viewer?.id);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
