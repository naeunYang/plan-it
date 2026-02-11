export interface User {
  user_id: string;
  email: string;
  password: string;
  name: string;
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  created_at: string;
  updated_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  content: string;
  due_date: string | null;
  is_completed: boolean;
  is_important: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  content: string;
  start_at: string;
  end_at: string | null;
  is_all_day: boolean;
  created_at: string;
}

export interface Issue {
  id: string;
  user_id: string;
  content: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  created_at: string;
}

export interface Memo {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}
