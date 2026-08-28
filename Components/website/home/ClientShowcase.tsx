import Image from "next/image";

import Container from "@/components/ui/Container";
import SectionHeader from "@/components/website/shared/SectionHeader";
import type { PublicClient } from "@/lib/public-site-data";

export default function ClientShowcase({ clients }: { clients: PublicClient[] }) {
  if (!clients.length) return null;
  return <section className="bg-slate-50 py-20 md:py-24"><Container><SectionHeader eyebrow="Trusted By" title="Clients Who Build With Us" subtitle="Partnerships grounded in dependable delivery, clear communication and lasting value." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{clients.map(client => {
    const card = <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">{client.logo ? <Image src={client.logo} alt={`${client.name} logo`} width={180} height={80} className="max-h-16 w-auto object-contain" /> : <span className="text-center text-lg font-bold text-slate-700">{client.name}</span>}</div>;
    return client.website ? <a key={client.id} href={client.website} target="_blank" rel="noreferrer" aria-label={`Visit ${client.name}`}>{card}</a> : <div key={client.id}>{card}</div>;
  })}</div></Container></section>;
}
