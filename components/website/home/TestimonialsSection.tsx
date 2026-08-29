import Image from "next/image";
import { Star } from "lucide-react";

import Container from "@/components/ui/Container";
import SectionHeader from "@/components/website/shared/SectionHeader";
import type { PublicTestimonial } from "@/lib/public-site-data";

export default function TestimonialsSection({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (!testimonials.length) return null;
  return <section className="bg-white py-20 md:py-24"><Container><SectionHeader eyebrow="Client Stories" title="What Our Clients Say" subtitle="Feedback from the people and organizations we have had the privilege to build for." /><div className="grid gap-6 lg:grid-cols-3">{testimonials.map(item => <article key={item.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="mb-5 flex gap-1 text-amber-500" aria-label={`${item.rating} out of 5 stars`}>{Array.from({ length: item.rating }, (_, index) => <Star key={index} className="size-4 fill-current" />)}</div><blockquote className="flex-1 text-base leading-7 text-slate-600">“{item.testimonial}”</blockquote><div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">{item.photo && <Image src={item.photo} alt={item.clientName} width={48} height={48} className="size-12 rounded-full object-cover" />}<div><p className="font-bold text-slate-900">{item.clientName}</p><p className="text-sm text-slate-500">{[item.designation, item.company].filter(Boolean).join(", ")}</p>{item.projectName && <p className="text-xs text-teal-700">{item.projectName}</p>}</div></div></article>)}</div></Container></section>;
}
