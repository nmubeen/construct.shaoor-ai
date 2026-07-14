import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { currentUser } from "@/lib/auth/auth";

export default async function LoginPage() {
  const user = await currentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Login
          </h1>

          <p className="mt-2 text-slate-500">
            Sign in to manage the website
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}