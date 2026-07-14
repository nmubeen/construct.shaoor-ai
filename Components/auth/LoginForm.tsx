"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/actions/auth.actions";

const initialState = {
  error: "",
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">
          Email
        </label>

        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Password
        </label>

        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#0E4A7B] py-3 font-medium text-white transition hover:bg-[#0A365A] disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}