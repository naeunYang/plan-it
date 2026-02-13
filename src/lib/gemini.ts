import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    todos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "할 일 내용" },
          due_date: { type: Type.STRING, nullable: true, description: "마감일 (YYYY-MM-DD 형식)" },
          is_important: { type: Type.BOOLEAN, description: "중요 여부" },
        },
        required: ["content", "is_important"],
      },
    },
    schedules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "일정 내용" },
          start_at: { type: Type.STRING, description: "시작 시간 (ISO 8601)" },
          end_at: { type: Type.STRING, nullable: true, description: "종료 시간 (ISO 8601)" },
          is_all_day: { type: Type.BOOLEAN, description: "종일 일정 여부" },
        },
        required: ["content", "start_at", "is_all_day"],
      },
    },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "이슈 내용" },
          status: { type: Type.STRING, enum: ["OPEN", "IN_PROGRESS", "DONE"], description: "이슈 상태" },
        },
        required: ["content", "status"],
      },
    },
    memos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, nullable: true, description: "메모 제목" },
          content: { type: Type.STRING, description: "메모 내용" },
        },
        required: ["content"],
      },
    },
  },
  required: ["todos", "schedules", "issues", "memos"],
};

export async function organizeText(text: string) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: text,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema,
      systemInstruction: `당신은 사용자의 자유 텍스트를 분석하여 할 일(todos), 일정(schedules), 이슈(issues), 메모(memos) 4가지로 분류하는 AI입니다.

오늘 날짜: ${today}

## 분류 기준 (키워드가 아닌 문맥/의도 기반으로 판단):
- **todo**: 실행하고 완료할 수 있는 구체적 작업 (예: "보고서 제출", "코드 리뷰", "장보기")
- **schedule**: 특정 시간/날짜에 발생하는 이벤트, 미팅, 약속 (예: "3시 회의", "금요일 저녁 약속")
- **issue**: 즉시 해결할 수 없고 지속적으로 추적해야 하는 문제 (예: "서버 간헐적 타임아웃", "빌드 실패 원인 파악 필요")
- **memo**: 정보, 아이디어, 참고사항 등 위 3가지에 해당하지 않는 내용

## 규칙:
- 하나의 문장이 여러 카테고리에 동시 분류될 수 있음 (예: "로그인 버그 수정" → todo + issue)
- 상대적 날짜 표현("내일", "다음 주 월요일", "모레")은 오늘 날짜 기준으로 절대 날짜(YYYY-MM-DD)로 변환
- 시간 정보가 없는 일정은 is_all_day: true로 설정
- 새로 발견된 이슈는 status: "OPEN"으로 설정
- 중요하다고 판단되는 할 일은 is_important: true로 설정
- 원문의 의미를 보존하되, 각 항목의 content는 간결하게 정리`,
    },
  });

  return JSON.parse(response.text!);
}
