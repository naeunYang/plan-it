import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 이름은 필수입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const { data: existing } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const { data: user, error } = await supabase
      .from("users")
      .insert({ email, password: hashedPassword, name })
      .select("user_id, email, name")
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "회원가입에 실패했습니다." },
        { status: 500 }
      );
    }

    await createSession(user.user_id);

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
