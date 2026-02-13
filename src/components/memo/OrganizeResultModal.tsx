"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import type { OrganizeResult } from "./MemoInput";

interface OrganizeResultModalProps {
  open: boolean;
  onClose: () => void;
  result: OrganizeResult;
  isGuest?: boolean;
}

export default function OrganizeResultModal({
  open,
  onClose,
  result: initialResult,
  isGuest = false,
}: OrganizeResultModalProps) {
  const router = useRouter();
  const [result, setResult] = useState<OrganizeResult>(initialResult);
  const [saving, setSaving] = useState(false);

  const updateTodo = (index: number, content: string) => {
    setResult((prev) => ({
      ...prev,
      todos: prev.todos.map((t, i) => (i === index ? { ...t, content } : t)),
    }));
  };

  const removeTodo = (index: number) => {
    setResult((prev) => ({
      ...prev,
      todos: prev.todos.filter((_, i) => i !== index),
    }));
  };

  const updateSchedule = (index: number, content: string) => {
    setResult((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s, i) =>
        i === index ? { ...s, content } : s
      ),
    }));
  };

  const removeSchedule = (index: number) => {
    setResult((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const updateIssue = (index: number, content: string) => {
    setResult((prev) => ({
      ...prev,
      issues: prev.issues.map((item, i) =>
        i === index ? { ...item, content } : item
      ),
    }));
  };

  const removeIssue = (index: number) => {
    setResult((prev) => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index),
    }));
  };

  const updateMemo = (index: number, content: string) => {
    setResult((prev) => ({
      ...prev,
      memos: prev.memos.map((m, i) => (i === index ? { ...m, content } : m)),
    }));
  };

  const removeMemo = (index: number) => {
    setResult((prev) => ({
      ...prev,
      memos: prev.memos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const requests = [];

      if (result.todos.length > 0) {
        requests.push(
          fetch("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: result.todos }),
          })
        );
      }

      if (result.schedules.length > 0) {
        requests.push(
          fetch("/api/schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: result.schedules }),
          })
        );
      }

      if (result.issues.length > 0) {
        requests.push(
          fetch("/api/issues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: result.issues }),
          })
        );
      }

      if (result.memos.length > 0) {
        requests.push(
          fetch("/api/memos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: result.memos }),
          })
        );
      }

      await Promise.all(requests);
      onClose();
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const totalCount =
    result.todos.length +
    result.schedules.length +
    result.issues.length +
    result.memos.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI 정리 결과</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="todos">
          <TabsList className="w-full">
            <TabsTrigger value="todos" className="flex-1">
              할 일 <Badge variant="secondary" className="ml-1">{result.todos.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex-1">
              일정 <Badge variant="secondary" className="ml-1">{result.schedules.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex-1">
              이슈 <Badge variant="secondary" className="ml-1">{result.issues.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="memos" className="flex-1">
              메모 <Badge variant="secondary" className="ml-1">{result.memos.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="flex flex-col gap-2 mt-3">
            {result.todos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">분류된 할 일이 없습니다.</p>
            )}
            {result.todos.map((todo, i) => (
              <Card key={i} className="flex items-center gap-2 p-3">
                <Input
                  value={todo.content}
                  onChange={(e) => updateTodo(i, e.target.value)}
                  className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
                {todo.due_date && (
                  <Badge variant="outline" className="shrink-0">{todo.due_date}</Badge>
                )}
                {todo.is_important && (
                  <Badge className="shrink-0">중요</Badge>
                )}
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeTodo(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="schedules" className="flex flex-col gap-2 mt-3">
            {result.schedules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">분류된 일정이 없습니다.</p>
            )}
            {result.schedules.map((schedule, i) => (
              <Card key={i} className="flex items-center gap-2 p-3">
                <Input
                  value={schedule.content}
                  onChange={(e) => updateSchedule(i, e.target.value)}
                  className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
                <Badge variant="outline" className="shrink-0">
                  {schedule.is_all_day ? "종일" : new Date(schedule.start_at).toLocaleString("ko-KR")}
                </Badge>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeSchedule(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="issues" className="flex flex-col gap-2 mt-3">
            {result.issues.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">분류된 이슈가 없습니다.</p>
            )}
            {result.issues.map((issue, i) => (
              <Card key={i} className="flex items-center gap-2 p-3">
                <Input
                  value={issue.content}
                  onChange={(e) => updateIssue(i, e.target.value)}
                  className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
                <Badge variant="outline" className="shrink-0">{issue.status}</Badge>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeIssue(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="memos" className="flex flex-col gap-2 mt-3">
            {result.memos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">분류된 메모가 없습니다.</p>
            )}
            {result.memos.map((memo, i) => (
              <Card key={i} className="flex items-center gap-2 p-3">
                <Input
                  value={memo.content}
                  onChange={(e) => updateMemo(i, e.target.value)}
                  className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeMemo(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          {isGuest ? (
            <Button onClick={() => router.push("/login")}>
              로그인하고 저장하기
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || totalCount === 0}>
              {saving ? "저장 중..." : "확인"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
