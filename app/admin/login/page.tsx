'use client';

import Container from "@/components/ui/Container";
import React from 'react';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <Container className="max-w-md">

        <div className="rounded-2xl bg-white p-10 shadow-xl">

          <h1 className="mb-8 text-center text-3xl font-bold">
            Admin Login
          </h1>

          <form className="space-y-6">

            <div>
              <label className="mb-2 block font-medium">
                Email
              </label>

              <input
                type="email"
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Password
              </label>

              <input
                type="password"
                className="w-full rounded-lg border p-3"
              />
            </div>

            <button
              className="w-full rounded-lg bg-[#0E4A7B] p-4 font-semibold text-white"
            >
              Login
            </button>

          </form>

        </div>

      </Container>
    </main>
  );
}