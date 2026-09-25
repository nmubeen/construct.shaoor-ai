import "server-only";

import { formatAnswer, type StoredAnswer } from "@/lib/enquiry/questions";
import { getConstructPrisma } from "@/lib/construct-prisma";

// Everything here is deterministic, templated from data already in the
// workspace — no AI, no invented scope/dimensions/prices/schedules (see
// AGENTS.md-equivalent constraint in the product spec: "the first
// version must work without an external AI provider... organize the
// implementation so AI-assisted rewriting could be added later"). Kept
// in its own service so a future AI-assisted rewrite step has one clear
// seam to slot into (replace/augment buildRequirementsSummary's output),
// without touching how a draft gets created or what data it starts from.

/** Plain-language requirements summary, built once at draft creation and
 * then freely editable — never regenerated over a staff edit. */
export function buildRequirementsSummary(params: {
  customerName: string;
  serviceTitle: string | null;
  subService: string | null;
  projectLocation: string | null;
  answers: StoredAnswer[];
  message: string;
}): string {
  const lines: string[] = [];
  lines.push(`${params.customerName} enquired about ${params.serviceTitle ?? "a construction service"}${params.subService ? ` — ${params.subService}` : ""}.`);
  lines.push(`Project location: ${params.projectLocation?.trim() || "Not specified — requires clarification."}`);

  if (params.answers.length === 0) {
    lines.push("");
    lines.push("No additional requirement details were captured on the enquiry form — requires clarification with the customer.");
  } else {
    lines.push("");
    lines.push("Requirement details as submitted:");
    for (const item of params.answers) {
      const isEmpty = Array.isArray(item.answer) ? item.answer.length === 0 : !item.answer.trim();
      lines.push(`- ${item.question}: ${isEmpty ? "Not answered — requires clarification." : formatAnswer(item.answer)}`);
    }
  }

  if (params.message.trim()) {
    lines.push("");
    lines.push(`Additional comments from the customer: "${params.message.trim()}"`);
  }

  return lines.join("\n");
}

export type PortfolioSuggestion = {
  projectId: string;
  title: string;
  reason: string;
};

const STOPWORDS = new Set(["the", "and", "for", "with", "your", "a", "an", "of", "to", "in", "on", "works", "work", "service", "services"]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  );
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) if (b.has(word)) count++;
  return count;
}

// Simple, explainable v1 matching (per the product spec's own
// permission to keep this basic): score each active, non-sample project
// by keyword overlap between the service's title/description and the
// project's title/category/description, plus a small bonus if the
// project's category is mentioned anywhere in the enquiry's own answers
// (e.g. a "Residential" vs "Commercial" property-type question). Falls
// back to the organization's most recently updated real projects when
// nothing scores above zero, with an honest "no strong match" reason —
// never invents or borrows another organization's project.
export async function suggestPortfolioProjects(params: {
  organizationId: string;
  serviceTitle: string | null;
  serviceDescription: string | null;
  answers: StoredAnswer[];
  limit?: number;
}): Promise<PortfolioSuggestion[]> {
  const prisma = getConstructPrisma();
  const limit = params.limit ?? 4;
  const projects = await prisma.project.findMany({
    where: { organizationId: params.organizationId, isActive: true, isSample: false },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, category: true, description: true },
  });
  if (projects.length === 0) return [];

  const serviceWords = significantWords(`${params.serviceTitle ?? ""} ${params.serviceDescription ?? ""}`);
  const answerText = params.answers.map((item) => (Array.isArray(item.answer) ? item.answer.join(" ") : item.answer)).join(" ").toLowerCase();

  const scored = projects.map((project) => {
    const projectWords = significantWords(`${project.title} ${project.category} ${project.description}`);
    let score = serviceWords.size > 0 ? overlapCount(serviceWords, projectWords) : 0;
    let reason: string | null = score > 0 && params.serviceTitle ? `Same service area — ${params.serviceTitle}` : null;
    if (project.category && answerText.includes(project.category.toLowerCase())) {
      score += 1;
      reason = reason ?? `Matches "${project.category}"`;
    }
    return { project, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);
  const strong = scored.filter((item) => item.score > 0).slice(0, limit);
  if (strong.length > 0) {
    return strong.map(({ project, reason }) => ({ projectId: project.id, title: project.title, reason: reason ?? "Related work" }));
  }

  // Honest fallback: no strong match, offer the most recent real work instead.
  return projects.slice(0, limit).map((project) => ({ projectId: project.id, title: project.title, reason: "No strong match — recently completed project" }));
}
