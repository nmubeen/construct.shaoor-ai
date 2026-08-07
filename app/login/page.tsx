import { redirect } from "next/navigation";
import type { Metadata } from "next";

import LoginForm from "@/components/auth/LoginForm";
import { currentUser } from "@/lib/auth/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const user = await currentUser();

  if (user) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Admin Login
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Sign in to continue
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
