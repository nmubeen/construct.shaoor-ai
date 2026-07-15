import PageBanner from "@/components/shared/PageBanner";
import ProcessTimeline from "@/components/website/process/ProcessTimeLine";
import CTA from "@/components/website/home/CTA";

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