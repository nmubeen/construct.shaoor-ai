"use client";

// Replaces the old password sign-in/sign-up pages — Construct is fully OTP
// now, so this one form covers both a brand-new account and a returning
// one. Styled with ConstructAuthShell (this app's existing auth look), not
// TuiTrak's AuthShell. Mirrors TuiTrak's EmailOtpForm.tsx structurally: this
// component never calls verifyOtp() or any membership RPC itself — that
// entire sequence runs server-side in submitAuth() (see
// lib/auth/actions.ts), on the same request/client as the OTP
// verification, before this component ever observes "signed-in".
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { ConstructAuthShell } from "@/components/auth/ConstructAuthShell";
import { createClient } from "@/lib/supabase/client";
import { submitAuth } from "@/lib/auth/actions";

const OTP_LENGTH = 6;
const field =
  "mt-2 w-full rounded-md border border-[#7D9D76] px-4 py-3 outline-none transition focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25";

export function EmailOtpForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"loading" | "signed-out" | "signed-in">("loading");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const deadline = useRef(0);
  const locked = useRef(false);
  const generation = useRef(0);

  // Only used to detect an already-established session (restored on mount,
  // or set in another tab) and skip straight to /dashboard.
  useEffect(() => {
    const lifecycle = generation;
    let active = true;
    let unsubscribe = () => {};
    try {
      const client = createClient();
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        generation.current += 1;
        setStatus(session ? "signed-in" : "signed-out");
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (err) {
      // Was a bare `catch {}` — logged nothing, so every failure here
      // (missing env vars, a rejected Supabase client, anything) looked
      // identical and undiagnosable. Log the real error so DevTools shows
      // what's actually failing instead of just this generic message.
      console.error("[EmailOtpForm] Failed to initialize Supabase auth client:", err);
      queueMicrotask(() => {
        if (active) {
          setError("Unable to initialize authentication. Reload to retry.");
          setStatus("signed-out");
        }
      });
    }
    return () => {
      active = false;
      lifecycle.current += 1;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Every protected route re-validates membership/organization state
    // itself (lib/auth/construct-context.ts) — this is a plain navigation,
    // not a client-side authorization decision.
    if (status === "signed-in") window.location.replace("/dashboard");
  }, [status]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))),
      250,
    );
    return () => window.clearInterval(timer);
  }, []);

  async function request(verify: boolean) {
    if (locked.current || status !== "signed-out") return;
    if (!verify && Date.now() < deadline.current) return;
    const normalized = (verify || destination ? destination : email).trim().toLowerCase();
    if (verify && !new RegExp(`^[0-9]{${OTP_LENGTH}}$`).test(code.trim())) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    const current = generation.current;
    try {
      const form = new FormData();
      form.set("email", normalized);
      if (verify) form.set("token", code.trim());
      const next = params.get("next");
      if (next) form.set("next", next);
      const result = await submitAuth(verify ? "verify-code" : "email-code", form);
      if (current !== generation.current) return;
      if (result.error) {
        setError(result.error);
      } else if (result.redirect) {
        // Full navigation only after the server action has fully completed
        // — including cookie writes and (for verify) membership
        // registration and organization provisioning.
        window.location.replace(result.redirect);
      } else if (!verify) {
        deadline.current = Date.now() + 60_000;
        setRemaining(60);
        setDestination(normalized);
        setEmail(normalized);
        setCode("");
      }
    } catch {
      if (current === generation.current) setError("Unable to connect. Check your connection and try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <ConstructAuthShell
      eyebrow={destination ? "Check your inbox" : "Customer account"}
      title={destination ? "Check your inbox" : "Sign in to Construct"}
      description={
        destination
          ? `We sent a sign-in code to ${destination}.`
          : "New here or returning? Use your email to continue — your trial workspace is created automatically."
      }
    >
      {status !== "signed-out" ? (
        <p role="status" className="text-sm text-slate-600">
          {status === "loading" ? "Checking your session…" : "Signing you in…"}
        </p>
      ) : (
        <form
          className="space-y-5"
          aria-busy={busy}
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void request(Boolean(destination));
          }}
        >
          {destination ? (
            <label key="code" className="block text-sm font-semibold text-slate-700">
              Verification code ({OTP_LENGTH} digits)
              <input
                autoFocus
                required
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "otp-error" : undefined}
                className={`${field} font-mono tracking-[0.35em]`}
              />
            </label>
          ) : (
            <label key="email" className="block text-sm font-semibold text-slate-700">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                placeholder="you@example.com"
                aria-describedby={error ? "otp-error" : undefined}
                className={field}
              />
            </label>
          )}
          {error && (
            <p id="otp-error" role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || (!destination && remaining > 0)}
            className="w-full rounded-md bg-(image:--gradient-button-bg) px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Please wait…" : destination ? "Verify and sign in" : "Send code"}
          </button>
          {remaining > 0 && (
            <p className="text-center text-xs text-slate-500">You can request another code in {remaining}s.</p>
          )}
          {destination && (
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                disabled={busy || remaining > 0}
                onClick={() => void request(false)}
                className="font-semibold text-(--color-secondary-text-icon) hover:underline disabled:opacity-50"
              >
                Resend code{remaining > 0 ? ` (${remaining}s)` : ""}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDestination("");
                  setCode("");
                  setError("");
                }}
                className="text-slate-600 hover:underline"
              >
                Use another email
              </button>
            </div>
          )}
          <p className="text-center text-xs text-slate-500">
            New accounts start a free trial. No password needed.
          </p>
        </form>
      )}
    </ConstructAuthShell>
  );
}
