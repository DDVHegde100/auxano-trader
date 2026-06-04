import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "auxano", version: "1.0.0" });
}
