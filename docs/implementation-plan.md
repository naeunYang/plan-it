# Plan it - 개인용 업무정리 툴 구현 계획서

## Context

바쁜 업무 중 파편화된 메모와 회의 기록을 AI가 자동으로 구조화하여 할 일, 일정, 이슈, 메모로 분류하고 저장하는 개인용 업무정리 툴. 사용자가 대충 적은 텍스트를 입력하면 Gemini API가 자동 분류하고, 사용자가 수정 후 확인하면 각 섹션에 저장됨. 단계별로 구현하여 각 단계마다 확인 후 진행.

---

## 기술스택

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반)
- **Backend**: Next.js API Routes
- **DB**: PostgreSQL (Supabase)
- **AI**: Google Gemini API (`@google/genai`, 모델: `gemini-2.5-flash`)
- **인증**: 커스텀 Session 기반 (HttpOnly 쿠키)
- **배포**: Vercel + Supabase

---

## 디렉토리 구조

```
planIt/
├── .env.local
├── middleware.ts                        # 인증 미들웨어
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # 루트 레이아웃
│   │   ├── page.tsx                     # 메인 (비로그인: 랜딩, 로그인: 대시보드 리다이렉트)
│   │   ├── (auth)/                      # 인증 라우트 그룹
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/                      # 메인 앱 라우트 그룹 (사이드바 레이아웃)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── todos/page.tsx
│   │   │   ├── schedules/page.tsx
│   │   │   ├── issues/page.tsx
│   │   │   ├── memos/page.tsx
│   │   │   └── history/page.tsx
│   │   └── api/
│   │       ├── auth/{register,login,logout,me}/route.ts
│   │       ├── ai/organize/route.ts
│   │       ├── todos/route.ts, [id]/route.ts
│   │       ├── schedules/route.ts, [id]/route.ts
│   │       ├── issues/route.ts, [id]/route.ts
│   │       ├── memos/route.ts, [id]/route.ts
│   │       └── history/route.ts
│   ├── components/
│   │   ├── ui/          # shadcn/ui 컴포넌트 (button, input, textarea, dialog, badge, checkbox, calendar, popover, card, tabs, dropdown-menu 등)
│   │   ├── layout/      # Sidebar, Header
│   │   ├── auth/        # LoginForm, RegisterForm
│   │   ├── memo/        # MemoInput, OrganizeResultModal
│   │   ├── dashboard/   # TodayTodos, TodaySchedules, RecentIssues, RecentMemos
│   │   ├── todos/       # TodoList, TodoItem, TodoForm
│   │   ├── schedules/   # CalendarView, MonthView, WeekView, DayView, ScheduleItem, ScheduleForm
│   │   ├── issues/      # KanbanBoard, KanbanColumn, IssueCard, IssueForm
│   │   ├── memos/       # MemoList, MemoCard, MemoEditor
│   │   └── history/     # Timeline, TimelineItem, DateRangeFilter, DailySummary
│   ├── lib/
│   │   ├── supabase/server.ts           # 서버 Supabase 클라이언트 (service_role)
│   │   ├── supabase/client.ts           # 브라우저 Supabase 클라이언트
│   │   ├── gemini.ts                    # Gemini API + 프롬프트
│   │   ├── auth.ts                      # 세션 관리 유틸리티
│   │   └── constants.ts
│   ├── hooks/           # useAuth, useTodos, useSchedules, useIssues, useMemos
│   ├── types/           # database.ts, api.ts, gemini.ts
│   └── styles/globals.css
```

---

## 1단계: 프로젝트 초기 설정 + DB + 인증 + 메모 입력/AI 정리

### 1-1. 프로젝트 초기화
- `npx create-next-app@latest` (TypeScript, Tailwind, App Router)
- `npx shadcn@latest init` (shadcn/ui 초기 설정)
- shadcn 컴포넌트 설치:
  ```
  npx shadcn@latest add button input textarea dialog badge checkbox calendar popover card tabs dropdown-menu separator tooltip
  ```
- 추가 의존성 설치:
  ```
  @supabase/supabase-js @google/genai zod zod-to-json-schema bcryptjs date-fns
  @types/bcryptjs (dev)
  ```
  > 참고: shadcn/ui가 `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`를 자동 설치함

### 1-2. Supabase DB 스키마 생성
Supabase SQL Editor에서 실행:

```sql
-- users
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'DELETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sessions
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- todos
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    is_all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- issues
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'DONE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- memos
CREATE TABLE memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_start_at ON schedules(start_at);
CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_memos_user_id ON memos(user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER memos_updated_at BEFORE UPDATE ON memos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

> **참고**: ERD에서 PK가 BIGINT AUTO_INCREMENT였지만 Supabase 환경에 맞춰 UUID로 변경. users 테이블의 session_id 컬럼은 sessions 테이블로 분리하여 1:N 관계로 처리 (여러 기기 동시 로그인 지원).

### 1-3. 인증 구현

**핵심 파일**: `src/lib/auth.ts`
- `hashPassword(password)` - bcryptjs로 해싱 (salt rounds: 12)
- `verifyPassword(password, hash)` - bcrypt 비교
- `createSession(userId)` - sessions 테이블 INSERT + HttpOnly 쿠키 설정 (7일 만료)
- `validateSession()` - 쿠키의 session_id로 세션 유효성 검증
- `destroySession()` - 세션 삭제 + 쿠키 제거
- `requireAuth()` - 인증 필수 API에서 호출, 미인증시 에러 throw

**미들웨어** (`middleware.ts`):
- 쿠키 존재 여부로 1차 게이트 (Edge Runtime에서 DB 조회 불가)
- 보호 페이지(/dashboard, /todos 등) → 세션 없으면 `/login` 리다이렉트
- 인증 페이지(/login, /register) → 세션 있으면 `/dashboard` 리다이렉트
- 보호 API(/api/todos 등) → 세션 없으면 401

**API 엔드포인트**:
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 (email, password, name) |
| POST | `/api/auth/login` | 로그인 → 세션 생성 + Set-Cookie |
| POST | `/api/auth/logout` | 로그아웃 → 세션 삭제 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### 1-4. Gemini AI 메모 정리

**핵심 파일**: `src/lib/gemini.ts`
- `@google/genai` SDK 사용
- Zod 스키마로 응답 구조 정의 → `responseJsonSchema`에 전달하여 Structured Output 보장
- 시스템 프롬프트: 자유 텍스트의 문맥/의도를 파악하여 todos/schedules/issues/memos 4가지로 분류
- 분류 기준 (키워드가 아닌 문맥 기반):
  - **todo**: 실행하고 완료할 수 있는 작업 (예: "보고서 제출", "코드 리뷰")
  - **schedule**: 특정 시간에 발생하는 이벤트, 미팅, 약속
  - **issue**: 즉시 해결할 수 없고, 지속적으로 추적해야 하는 문제 (예: "서버 간헐적 타임아웃", "A 프로젝트 일정 밀림")
  - **memo**: 정보, 아이디어, 참고사항 등 위 3가지에 해당하지 않는 내용
- 하나의 문장이 여러 카테고리에 동시 분류될 수 있음 (예: "로그인 버그 수정" → todo + issue)
- 상대적 날짜("내일", "다음 주") → 오늘 날짜 기준 절대 날짜로 변환
- temperature: 0.2 (일관된 분류)

**API**: `POST /api/ai/organize`
- 요청: `{ text: string }`
- 응답: `{ todos: [...], schedules: [...], issues: [...], memos: [...] }`

### 1-5. 메인 페이지 + 메모 입력 UI

**비로그인 메인** (`src/app/page.tsx`):
- "Plan it" 로고
- 큰 텍스트 입력 영역 (`MemoInput` 컴포넌트)
- 로그인 유도 CTA

**AI 정리 결과 모달** (`OrganizeResultModal`):
- 탭으로 할 일/일정/이슈/메모 분류 결과 표시
- 각 항목 인라인 수정/삭제 가능
- "확인" 버튼 → 4개 API 병렬 호출로 일괄 저장
- "다시 정리" 버튼 → Gemini 재호출

### 1-6. UI 컴포넌트
- shadcn/ui의 `Button`, `Input`, `Textarea`, `Dialog`, `Card` 등을 활용
- 커스텀 컴포넌트는 shadcn/ui를 조합하여 구성 (예: OrganizeResultModal은 Dialog + Tabs + Card 조합)

---

## 2단계: 할 일/일정/이슈/메모 CRUD + 레이아웃

### 2-1. 사이드바 레이아웃
- `Sidebar`: 네비게이션 메뉴 (대시보드, 할 일, 일정, 이슈, 메모, 히스토리)
- `Header`: 페이지 타이틀 + 간소화된 메모 입력 + 사용자 메뉴
- `(main)/layout.tsx`에서 조합

### 2-2. 할 일 (Todos)
- **API**: `GET/POST /api/todos`, `PATCH/DELETE /api/todos/[id]`
- **쿼리 필터**: `?date=`, `?completed=`, `?from=&to=`
- **페이지**: 날짜별 그룹핑, 체크박스 완료 토글, 중요 표시, 인라인 추가/수정
- **낙관적 업데이트**: 체크 토글시 UI 즉시 반영

### 2-3. 일정 (Schedules)
- **API**: `GET/POST /api/schedules`, `PATCH/DELETE /api/schedules/[id]`
- **쿼리 필터**: `?month=`, `?week=`, `?date=`
- **페이지**: 월간/주간/일간 뷰 전환 캘린더
- 월간: 날짜 그리드 + 일정 점 표시, 클릭시 일간 뷰
- 일간: 시간축 + 일정 상세 블록

### 2-4. 이슈 (Issues)
- **API**: `GET/POST /api/issues`, `PATCH/DELETE /api/issues/[id]`
- **쿼리 필터**: `?status=`
- **페이지**: 칸반 보드 (OPEN / IN_PROGRESS / DONE 3컬럼)
- 드래그앤드롭으로 상태 변경 (`@hello-pangea/dnd` 라이브러리)
- 카드 클릭시 수정 모달

### 2-5. 메모 (Memos)
- **API**: `GET/POST /api/memos`, `GET/PATCH/DELETE /api/memos/[id]`
- **페이지**: 날짜별 메모 카드 목록, 클릭시 상세/수정 모달
- updated_at 표시

---

## 3단계: Today 대시보드 + 히스토리

### 3-1. Today 대시보드 (`/dashboard`)
- 메모 입력 영역 (항상 상단 노출)
- 2x2 그리드:
  - 오늘 할 일 (미완료 + 오늘 마감)
  - 오늘 일정
  - 진행 중 이슈 (OPEN + IN_PROGRESS)
  - 최근 메모

### 3-2. 히스토리 (`/history`)
- **API**: `GET /api/history?from=&to=`
- 날짜 범위 검색
- 날짜별 요약 카드 (완료 할 일, 새 할 일, 일정, 이슈, 메모 카운트)
- 타임라인 뷰 (날짜별 항목 나열)
- 로그인 메인 페이지에서 대시보드로 리다이렉트 연결

---

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| `shadcn/ui` | UI 컴포넌트 시스템 (Radix UI + Tailwind) |
| `@supabase/supabase-js` | DB 클라이언트 |
| `@google/genai` | Gemini API SDK |
| `zod` + `zod-to-json-schema` | 타입 안전 스키마 + Gemini Structured Output |
| `bcryptjs` | 비밀번호 해싱 |
| `@hello-pangea/dnd` | 이슈 칸반 드래그앤드롭 |
| `date-fns` | 날짜 유틸리티 (한국어 locale) |
| `lucide-react` | 아이콘 (shadcn/ui 기본 아이콘) |
| `clsx` + `tailwind-merge` + `class-variance-authority` | shadcn/ui 자동 설치 유틸리티 |

## Supabase 연결 방식

- `service_role` 키로 서버 클라이언트 생성 (RLS 우회)
- 모든 DB 작업은 API Route에서 수행, `requireAuth()`로 user_id 확보 후 `.eq("user_id", userId)` 조건 필수 추가
- 클라이언트에서 직접 Supabase 호출하지 않음 (모두 API Route 경유)

---

## 검증 방법

### 1단계 검증
- `npm run dev`로 로컬 서버 정상 구동
- 회원가입 → DB에 사용자 레코드 생성 확인
- 로그인 → 쿠키에 `session_id` 설정 확인
- 비로그인 `/dashboard` 접근 → `/login` 리다이렉트 확인
- 메모 입력 → AI 정리 결과 모달 표시 확인
- "확인" 클릭 → 각 테이블에 데이터 저장 확인

### 2단계 검증
- 할 일 CRUD (생성, 완료 토글, 중요 표시, 수정, 삭제)
- 일정 캘린더 월간/주간/일간 뷰 전환
- 이슈 칸반 드래그앤드롭 상태 변경
- 메모 목록 조회, 상세, 수정, 삭제

### 3단계 검증
- 대시보드 4개 위젯 데이터 정상 표시
- 히스토리 날짜 범위 검색 + 일일 요약 카운트 정확성
