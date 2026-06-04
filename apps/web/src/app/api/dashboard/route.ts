import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/services/portfolio";

export async function GET(req: Request) {
  try {
    const user = await requireDbUser(req);
    const data = await getDashboardData(user.id);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
