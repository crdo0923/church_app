import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, user: null }, { status: 401 });
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    },
  });
}
