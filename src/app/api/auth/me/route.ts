import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { validateSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "인증되지 않았습니다." }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, name, status, created_at")
      .eq("user_id", session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
