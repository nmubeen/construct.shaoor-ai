import { ChevronDown } from "lucide-react";

import Container from "@/components/ui/Container";
import SectionHeader from "@/components/website/shared/SectionHeader";
import type { PublicFaq } from "@/lib/public-site-data";

export default function FaqSection({ faqs }: { faqs: PublicFaq[] }) {
  if (!faqs.length) return null;
  return <section className="bg-slate-50 py-20 md:py-24"><Container className="max-w-4xl"><SectionHeader eyebrow="Frequently Asked Questions" title="Planning Your Next Project?" subtitle="Clear answers to common questions about working with our team." /><div className="grid gap-3">{faqs.map(faq => <details key={faq.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">{faq.question}<ChevronDown className="size-5 shrink-0 text-teal-700 transition group-open:rotate-180" /></summary><p className="mt-4 whitespace-pre-line border-t border-slate-100 pt-4 leading-7 text-slate-600">{faq.answer}</p></details>)}</div></Container></section>;
}
