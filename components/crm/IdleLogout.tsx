"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const THROTTLE_MS = 5000;

/**
 * Signs the user out after 15 minutes with no activity and shows a clear
 * "session timed out" dialog with a link back to login. Mounted in the app shell.
 */
export function IdleLogout() {
  const router = useRouter();
  const [out, setOut] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (out) return;

    async function onTimeout() {
      try {
        await createClient().auth.signOut();
      } catch {
        /* show the dialog regardless */
      }
      setOut(true);
    }
    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(onTimeout, TIMEOUT_MS);
    }
    function onActivity() {
      const now = Date.now();
      if (now - last.current > THROTTLE_MS) {
        last.current = now;
        reset();
      }
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [out]);

  if (!out) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
      <div className="card w-full max-w-sm p-6 text-center animate-rise">
        <h3 className="text-base font-semibold text-ink">Session timed out</h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          You were signed out after 15 minutes of inactivity to keep the team's data safe.
        </p>
        <button onClick={() => router.push("/login")} className="btn-primary mt-4 w-full">
          Log in again
        </button>
      </div>
    </div>
  );
}
