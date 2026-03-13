import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }
  const token = createToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
