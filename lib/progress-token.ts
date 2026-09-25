import "server-only";

import crypto from "crypto";

// Bearer-link token for a private progress page's public URL.
// Deliberately HASH-ONLY storage (unlike Proposal.token, which is
// stored raw so "Copy link" can redisplay it indefinitely) — these are
// private construction-site photographs, not a sales pitch, and the
// product spec explicitly prefers hashing here. The raw token is
// returned to the caller exactly once, right after generate/rotate, and
// never persisted anywhere in plaintext — same "emailed and forgotten"
// trust model as Invitation.tokenHash. High-entropy (32 random bytes,
// base64url — 43 chars, ~256 bits), same generation shape as
// generateProposalToken().
export function generateProgressToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// SHA-256 is enough here — unlike a password, this token is never
// guessable/brute-forceable offline from its hash alone (256 bits of
// entropy), so a slow KDF (bcrypt/argon2) buys nothing and would only
// slow down the public route's own lookup on every request.
export function hashProgressToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
