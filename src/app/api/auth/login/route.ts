import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, name, password, status")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "비활성화된 계정입니다." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 만료된 세션 정리
    await supabase
      .from("sessions")
      .delete()
      .eq("user_id", user.user_id)
      .lt("expires_at", new Date().toISOString());

    await createSession(user.user_id);

    return NextResponse.json({
      user: { user_id: user.user_id, email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
