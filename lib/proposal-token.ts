import "server-only";

import crypto from "crypto";

// Bearer-link token for a proposal's public URL. High-entropy (32 random
// bytes, base64url — 43 chars, ~256 bits) so it's infeasible to guess.
// Stored directly (see Proposal.token's schema comment for why this
// isn't hashed like a one-time, emailed-and-forgotten token would be —
// the dashboard's "Copy link" needs to redisplay it indefinitely).
export function generateProposalToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
