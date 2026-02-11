# Plan it

개인용 업무정리 툴. 자유 텍스트를 AI(Gemini)가 할일/일정/이슈/메모로 자동 분류.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- Supabase (PostgreSQL), Gemini API
- 인증: 커스텀 세션 기반 (HttpOnly 쿠키)

## 구현 계획서
- docs/implementation-plan.md 참조 (단계별 구현 진행 중)

## Rules
- 한국어로 응답
- shadcn/ui 컴포넌트 우선 사용
- DB 작업은 반드시 API Route 경유 (클라이언트에서 Supabase 직접 호출 금지)
- 단계별 구현: 작업 전 컨펌 받기
