// Creates a Razorpay Plan for each paid, interval-specific code in
// construct.plans (STARTER_MONTHLY, STARTER_ANNUAL, GROWTH_MONTHLY, ...;
// FREE needs no Plan) and writes the resulting Plan ID back onto that
// row. Mirrors TuiTrak's own scripts/seed-razorpay-plans.mjs
// (C:\Projects\TuiTrakWeb) in approach, adapted to this repo's
// Prisma-based DB access instead of a raw `pg` client.
//
// Unlike TuiTrak (one plan code covers both intervals in a single row),
// every construct.plans row is already interval-specific — its code ends
// _MONTHLY or _ANNUAL — so each row only ever gets ONE of its two
// razorpayPlanId* columns populated, matching its own suffix. The other
// column stays null; that's expected, not a partial seed. See the
// checkoutInterval comment in app/dashboard/settings/page.tsx for why
// this distinction matters (the interval passed to checkout is derived
// from the plan code's own suffix, so it must line up with which column
// actually holds a value).
//
// Idempotent: re-running reuses an existing Plan with the same
// name+amount+period instead of creating a duplicate — Razorpay's Plans
// API has no search endpoint, so this lists and matches client-side.
//
// NOTE: this is a LIVE Razorpay account action for whichever mode
// RAZORPAY_KEY_ID/SECRET belong to (test or live) — it creates real Plan
// objects there. Run it deliberately, not as part of routine deploys.
// Test-mode Plan IDs do NOT carry over to Live mode — re-run this again
// with live keys once you switch, or checkout will fail with "plan not
// found" even though this script already ran once.
//
// Usage: npm run razorpay:seed-plans   (reads .env, then .env.local)
import fs from "fs";
import path from "path";

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

const root = path.resolve(__dirname, "..");
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET is not set (checked .env and .env.local).");
  process.exit(1);
}
if (!process.env.CONSTRUCT_DATABASE_URL) {
  console.error("CONSTRUCT_DATABASE_URL is not set (checked .env and .env.local).");
  process.exit(1);
}

import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/construct-client";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Change these (and re-run) if pricing changes — this only affects what
// gets created in Razorpay and written back to construct.plans, not
// control.plans (the shared control-plane catalog that actually drives
// what /pricing displays; keep these numbers in sync with it by hand —
// confirmed current live values via control.plans on 2026-09-25).
const PLANS = [
  { code: "STARTER_MONTHLY", name: "Starter", period: "monthly" as const, amountInr: 399, column: "razorpayPlanIdMonthly" as const },
  { code: "STARTER_ANNUAL", name: "Starter", period: "yearly" as const, amountInr: 3999, column: "razorpayPlanIdAnnual" as const },
  { code: "GROWTH_MONTHLY", name: "Growth", period: "monthly" as const, amountInr: 699, column: "razorpayPlanIdMonthly" as const },
  { code: "GROWTH_ANNUAL", name: "Growth", period: "yearly" as const, amountInr: 6999, column: "razorpayPlanIdAnnual" as const },
  { code: "ENTERPRISE_MONTHLY", name: "Enterprise", period: "monthly" as const, amountInr: 999, column: "razorpayPlanIdMonthly" as const },
  { code: "ENTERPRISE_ANNUAL", name: "Enterprise", period: "yearly" as const, amountInr: 9999, column: "razorpayPlanIdAnnual" as const },
];

type RazorpayPlan = { id: string; period: string; item: { name: string; amount: number } };

async function findOrCreatePlan(itemName: string, amountInr: number, period: "monthly" | "yearly"): Promise<RazorpayPlan> {
  const { items: existing } = (await razorpay.plans.all({ count: 100 })) as { items: RazorpayPlan[] };
  const match = existing.find((p) => p.item.name === itemName && p.item.amount === amountInr * 100 && p.period === period);
  if (match) return match;

  return (await razorpay.plans.create({
    period,
    interval: 1,
    item: {
      name: itemName,
      amount: amountInr * 100, // paise
      currency: "INR",
    },
  })) as unknown as RazorpayPlan;
}

async function main() {
  const prisma = new PrismaClient({ datasourceUrl: process.env.CONSTRUCT_DATABASE_URL });

  try {
    for (const plan of PLANS) {
      const label = `${plan.name} (${plan.period === "yearly" ? "Annual" : "Monthly"})`;
      const itemName = `Shaoor-AI Construct — ${label}`;
      const razorpayPlan = await findOrCreatePlan(itemName, plan.amountInr, plan.period);
      console.log(`${plan.code}: ${razorpayPlan.id} (₹${plan.amountInr}/${plan.period === "yearly" ? "yr" : "mo"})`);
      await prisma.plan.update({ where: { code: plan.code }, data: { [plan.column]: razorpayPlan.id } });
    }

    console.log("\nDone — construct.plans updated with Razorpay Plan IDs.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
