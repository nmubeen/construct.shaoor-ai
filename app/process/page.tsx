import PageBanner from "@/components/shared/PageBanner";
import ProcessTimeline from "@/components/process/ProcessTimeLine";
import CTA from "@/components/home/CTA";

export default function ProcessPage() {
  return (
    <>
      <PageBanner
        title="Our Process"
        subtitle="From Vision to Reality"
      />

      <ProcessTimeline />

      <CTA />
    </>
  );
}