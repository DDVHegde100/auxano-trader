import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { updateMyProfile, getUserProfile } from "@/lib/services/friends";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    if (!user.username) {
      return NextResponse.json(
        { error: "Set a username in Clerk to enable your profile" },
        { status: 400 }
      );
    }
    const profile = await getUserProfile(user.username, user.id);
    return NextResponse.json(profile);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireDbUser(req);
    const body = await req.json();
    const updated = await updateMyProfile(user.id, {
      bio: typeof body.bio === "string" ? body.bio : undefined,
      isProfilePublic:
        typeof body.isProfilePublic === "boolean"
          ? body.isProfilePublic
          : undefined,
    });
    return NextResponse.json({ user: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
