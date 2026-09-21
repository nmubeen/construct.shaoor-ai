import "server-only";

import { getConstructPrisma } from "@/lib/construct-prisma";
import { isQuestionType, parseOptions, type PublicEnquiryQuestion } from "@/lib/enquiry/questions";

// The only reader the public site uses: active questions of one active
// service, scoped to the organization resolved from the request host, in
// display order, reduced to just what the form needs to render.
export async function getActiveEnquiryQuestions(organizationId: string, serviceId: string): Promise<PublicEnquiryQuestion[]> {
  const rows = await getConstructPrisma().serviceEnquiryQuestion.findMany({
    where: { organizationId, serviceId, isActive: true, service: { isActive: true } },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.flatMap((row) => isQuestionType(row.questionType)
    ? [{ id: row.id, questionText: row.questionText, questionType: row.questionType, options: parseOptions(row.options), isRequired: row.isRequired }]
    : []);
}
