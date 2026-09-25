import path from "path";
import { defineConfig } from "vitest/config";

// Minimal test setup — this repo has no prior test framework, so this is
// intentionally small (no React/DOM testing here, just Node-side
// server-only logic) rather than a full testing-library migration. Tests
// under tests/proposals/ cover the boundaries the Project Proposal
// feature spec calls out explicitly: cross-org isolation, entitlement
// gating, draft/publish/revoke lifecycle, snapshot immutability, and
// money/range validation. Integration tests talk to the real database
// (via CONSTRUCT_DATABASE_URL, loaded from .env below) using a
// dedicated, disposable test organization cleaned up in afterAll —
// there's no separate test DB in this project, matching how every
// verification in this codebase's history has been done directly
// against the same Supabase Postgres instance.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    // Every test file opens its own PrismaClient against the same live
    // Supabase pooler (see fixtures.ts's own comment) — with several
    // suites' beforeAll hooks racing for pooled connections when the
    // whole suite runs together, the default 10s hook timeout can trip
    // even though no individual query is slow. Match testTimeout.
    hookTimeout: 30000,
    setupFiles: ["tests/setup-env.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
});
