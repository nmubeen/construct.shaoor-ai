import { describe, expect, it } from "vitest";

import { buildRequirementsSummary } from "@/lib/services/construct-proposal-draft.service";

describe("buildRequirementsSummary", () => {
  it("never invents content — only templates what was actually submitted", () => {
    const summary = buildRequirementsSummary({
      customerName: "Asha Rao",
      serviceTitle: "Interior & Fit-Out Works",
      subService: null,
      projectLocation: "Whitefield, Bengaluru",
      answers: [
        { questionId: "q1", question: "What is the approximate area?", type: "short_text", answer: "1200 sq ft" },
        { questionId: "q2", question: "Preferred start date?", type: "date", answer: "" },
      ],
      message: "Would like a modular kitchen.",
    });

    expect(summary).toContain("Asha Rao");
    expect(summary).toContain("Interior & Fit-Out Works");
    expect(summary).toContain("Whitefield, Bengaluru");
    // The actual submitted answer, with its unit, preserved verbatim.
    expect(summary).toContain("1200 sq ft");
    // An unanswered question is labeled as needing clarification, not guessed at.
    expect(summary).toContain("Preferred start date?: Not answered — requires clarification.");
    expect(summary).toContain("Would like a modular kitchen.");
    // Never fabricates a price, schedule or qualification.
    expect(summary.toLowerCase()).not.toMatch(/\brs\.?\s?\d|₹\s?\d|guarantee|certified|licensed/);
  });

  it("labels a missing project location as requiring clarification rather than omitting it", () => {
    const summary = buildRequirementsSummary({
      customerName: "Test Customer",
      serviceTitle: null,
      subService: null,
      projectLocation: null,
      answers: [],
      message: "",
    });
    expect(summary).toContain("Not specified — requires clarification.");
    expect(summary).toContain("No additional requirement details were captured");
  });
});
