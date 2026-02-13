"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface MemoInputProps {
  onOrganize: (result: OrganizeResult) => void;
}

export interface OrganizeResult {
  todos: { content: string; due_date: string | null; is_important: boolean }[];
  schedules: {
    content: string;
    start_at: string;
    end_at: string | null;
    is_all_day: boolean;
  }[];
  issues: { content: string; status: "OPEN" | "IN_PROGRESS" | "DONE" }[];
  memos: { title: string | null; content: string }[];
}

export default function MemoInput({ onOrganize }: MemoInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      onOrganize(result);
      setText("");
    } catch {
      alert("AI 정리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="할 일, 일정, 메모 등을 자유롭게 입력하세요..."
        className="min-h-[120px] resize-none"
      />
      <Button onClick={handleSubmit} disabled={loading || !text.trim()}>
        {loading ? "AI 정리 중..." : "AI로 정리하기"}
      </Button>
    </div>
  );
}
