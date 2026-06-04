import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auxano_dev_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
