"use client";

import { useState } from "react";

import Modal from "@/components/ui/Modal";
import ServiceEnquiryForm, { type EnquiryServiceOption } from "@/components/website/enquiry/ServiceEnquiryForm";

// Launches the shared ServiceEnquiryForm in a dialog with the service
// already selected. Used by Home featured services, the Services list and
// the Service detail page. The form (and its question fetch) only mounts
// while the dialog is open.
export default function EnquireButton({ service, subService, label = "Enquire Now", className }: {
  service: EnquiryServiceOption;
  subService?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{label}</button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ServiceEnquiryForm services={[service]} lockedServiceId={service.id} subService={subService} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
