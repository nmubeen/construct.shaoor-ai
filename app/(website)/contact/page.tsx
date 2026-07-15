import Container from "@/components/ui/Container";
import PageBanner from "@/components/shared/PageBanner";
import ContactForm from "@/components/website/contact/ContactForm";
import ContactInfo from "@/components/website/contact/ContactInfo";
import CTA from "@/components/website/home/CTA";

export default function ContactPage() {
  return (
    <>
      <PageBanner
        title="Contact Us"
        subtitle="Let's Build Together"
      />

      <section className="py-24">
        <Container>

          <div className="grid gap-16 lg:grid-cols-2">

            <ContactForm />

            <ContactInfo />

          </div>

        </Container>
      </section>

      <section className="bg-slate-200 py-32">
        <Container>

          <div className="flex h-96 items-center justify-center rounded-2xl bg-slate-300">
            Google Map Placeholder
          </div>

        </Container>
      </section>

      <CTA />

    </>
  );
}