import PageBanner from "@/components/shared/PageBanner";

export default function StudioPage() {
  return (
    <>
      <PageBanner
        title="Our Studio"
        subtitle="About SAM Constructions"
      />

      <section className="py-24">
        <div className="container">

          <h2 className="mb-8 text-4xl font-bold">
            Designing Spaces That Inspire
          </h2>

          <p className="max-w-4xl text-lg leading-9 text-slate-600">

            At SAM Constructions we combine architecture,
            construction and interior design to create
            exceptional spaces that reflect our clients'
            aspirations while maintaining functionality,
            quality and timeless aesthetics.

          </p>

        </div>
      </section>
    </>
  );
}