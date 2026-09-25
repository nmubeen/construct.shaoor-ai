// Stub for the "server-only" package under Vitest — Next's bundler
// understands this import specially (it's what makes importing a
// server-only module from client code a build error); outside that
// bundler it's just a package Node/Vite can't resolve at all. Standard
// fix for testing Next.js server-only modules: alias it to a no-op here
// (see vitest.config.ts), since the guarantee it provides is itself
// enforced by Next's build, not by anything meaningful for a test to
// re-check.
export {};
