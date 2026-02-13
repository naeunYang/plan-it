import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import { organizeText } from "@/lib/gemini";

const GUEST_LIMIT = 3;
const GUEST_COOKIE = "guest_ai_count";

export async function POST(request: Request) {
  try {
    const session = await validateSession();

    // 비로그인 시 사용 횟수 제한
    if (!session) {
      const cookieStore = await cookies();
      const count = parseInt(cookieStore.get(GUEST_COOKIE)?.value || "0", 10);

      if (count >= GUEST_LIMIT) {
        return NextResponse.json(
          { error: "비로그인 사용 횟수(3회)를 초과했습니다. 로그인 후 이용해주세요." },
          { status: 403 }
        );
      }

      const { text } = await request.json();

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json(
          { error: "텍스트를 입력해주세요." },
          { status: 400 }
        );
      }

      const result = await organizeText(text.trim());

      const response = NextResponse.json(result);
      response.cookies.set(GUEST_COOKIE, String(count + 1), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
      });
      return response;
    }

    // 로그인 사용자는 제한 없음
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "텍스트를 입력해주세요." },
        { status: 400 }
      );
    }

    const result = await organizeText(text.trim());

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "AI 정리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
