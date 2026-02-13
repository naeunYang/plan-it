"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MemoInput, { type OrganizeResult } from "@/components/memo/MemoInput";
import OrganizeResultModal from "@/components/memo/OrganizeResultModal";

export default function Home() {
  const [result, setResult] = useState<OrganizeResult | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Plan it</h1>
        <p className="text-lg text-muted-foreground">
          대충 적어도 괜찮아요.
          <br />
          입력한 내용을 알아서 정리해드려요.
        </p>

        <div className="w-full">
          <MemoInput onOrganize={setResult} />
        </div>

        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">회원가입</Link>
          </Button>
        </div>
      </div>

      {result && (
        <OrganizeResultModal
          open={!!result}
          onClose={() => setResult(null)}
          result={result}
          isGuest
        />
      )}
    </div>
  );
}
