import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Exchanges the magic-link / invite code for a session, then sends the user home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(origin + "/");
}
