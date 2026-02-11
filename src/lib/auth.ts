import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase/server";

const SESSION_COOKIE = "session_id";
const SESSION_EXPIRY_DAYS = 7;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, expires_at: expiresAt.toISOString() })
    .select("session_id")
    .single();

  if (error || !data) throw new Error("세션 생성 실패");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, data.session_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return data.session_id;
}

export async function validateSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const { data, error } = await supabase
    .from("sessions")
    .select("session_id, user_id, expires_at")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return null;

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("session_id", sessionId);
    const cs = await cookies();
    cs.delete(SESSION_COOKIE);
    return null;
  }

  return { sessionId: data.session_id, userId: data.user_id };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return;

  await supabase.from("sessions").delete().eq("session_id", sessionId);
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth() {
  const session = await validateSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
