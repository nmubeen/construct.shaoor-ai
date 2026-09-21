// Shared (client + server) definitions for the service enquiry form. This is
// the single source of truth for question types: the dashboard editor, the
// public form renderer and the server-side answer validation all read it.

export const QUESTION_TYPES = ["short_text", "long_text", "number", "single_select", "multi_select", "yes_no", "date"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  number: "Number",
  single_select: "Single Select",
  multi_select: "Multi Select",
  yes_no: "Yes / No",
  date: "Date",
};

export const MAX_OPTIONS = 30;
export const MAX_OPTION_LENGTH = 120;
export const MAX_QUESTION_LENGTH = 300;

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && (QUESTION_TYPES as readonly string[]).includes(value);
}

export function hasOptions(type: string) {
  return type === "single_select" || type === "multi_select";
}

/** What the public form is allowed to see about a question. */
export type PublicEnquiryQuestion = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  isRequired: boolean;
};

export type AnswerValue = string | string[];

/** One stored answer. `question` is a snapshot of the text the visitor actually saw. */
export type StoredAnswer = {
  questionId: string;
  question: string;
  type: QuestionType;
  answer: AnswerValue;
};

export function parseOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
}

/** Tolerant reader for the answers JSONB column — never throws on odd data. */
export function parseStoredAnswers(value: unknown): StoredAnswer[] {
  if (!Array.isArray(value)) return [];
  const result: StoredAnswer[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { questionId, question, type, answer } = item as Record<string, unknown>;
    if (typeof question !== "string") continue;
    const normalized = Array.isArray(answer) ? answer.filter((entry): entry is string => typeof entry === "string") : typeof answer === "string" ? answer : null;
    if (normalized === null) continue;
    result.push({ questionId: typeof questionId === "string" ? questionId : "", question, type: isQuestionType(type) ? type : "short_text", answer: normalized });
  }
  return result;
}

export function formatAnswer(answer: AnswerValue) {
  return Array.isArray(answer) ? answer.join(", ") : answer;
}

export function isBlank(value: AnswerValue | undefined) {
  return value === undefined || (Array.isArray(value) ? value.length === 0 : value.trim() === "");
}

/**
 * Validates one raw answer against its question. Returns the cleaned value,
 * `null` when the question was left empty (and is optional), or an error
 * message. Used by the public form (for instant feedback) and again on the
 * server (the authority — the client is never trusted).
 */
export function checkAnswer(question: PublicEnquiryQuestion, raw: AnswerValue | undefined): { value: AnswerValue | null } | { error: string } {
  const label = question.questionText;
  if (isBlank(raw)) return question.isRequired ? { error: `Please answer: ${label}` } : { value: null };

  switch (question.questionType) {
    case "short_text":
    case "long_text": {
      if (typeof raw !== "string") return { error: `Invalid answer for: ${label}` };
      const text = raw.trim();
      const max = question.questionType === "short_text" ? 300 : 2000;
      return text.length > max ? { error: `Answer is too long for: ${label}` } : { value: text };
    }
    case "number": {
      if (typeof raw !== "string" || raw.trim() === "" || !Number.isFinite(Number(raw))) return { error: `Please enter a valid number for: ${label}` };
      return { value: raw.trim() };
    }
    case "date": {
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) return { error: `Please enter a valid date for: ${label}` };
      return { value: raw };
    }
    case "yes_no":
      return raw === "Yes" || raw === "No" ? { value: raw } : { error: `Please choose Yes or No for: ${label}` };
    case "single_select":
      return typeof raw === "string" && question.options.includes(raw) ? { value: raw } : { error: `Please choose one of the options for: ${label}` };
    case "multi_select": {
      const picked = Array.isArray(raw) ? raw : [];
      // Preserve the tenant's option order, and reject anything not on the list.
      if (picked.some((item) => !question.options.includes(item))) return { error: `Please choose from the listed options for: ${label}` };
      return { value: question.options.filter((option) => picked.includes(option)) };
    }
  }
}
