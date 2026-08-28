import { ServiceForm } from "@/components/dashboard/services/ServiceForm";
import { requireActiveConstructContext } from "@/lib/auth/construct-context";
import { redirect } from "next/navigation";
export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const context = await requireActiveConstructContext(); if (context.role === "VIEWER") redirect("/dashboard/services"); const { error } = await searchParams; return <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Services</p><h1 className="mt-2 text-3xl font-bold">Create service</h1></header><ServiceForm error={error} /></div>; }
