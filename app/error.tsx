"use client";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Something went wrong
        </h1>

        <button
          onClick={() => reset()}
          className="mt-8 rounded-lg bg-[#0E4A7B] px-6 py-3 text-white"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}