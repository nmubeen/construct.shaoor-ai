"use client";

import { useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import ServiceEnquiryForm, { type EnquiryServiceOption } from "@/components/website/enquiry/ServiceEnquiryForm";

// Launches the shared ServiceEnquiryForm in a dialog with the service
// already selected. Used by Home featured services, the Services list and
// the Service detail page — always as a true, full-viewport popup (Modal
// portals to <body>), regardless of what card/container this button sits
// inside. The form (and its question fetch) only mounts while the dialog
// is open, so every open starts from a clean form.
export default function EnquireButton({ service, subService, label = "Enquire Now", className }: {
  service: EnquiryServiceOption;
  subService?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Tracks whether the visitor has typed/selected anything this time the
  // dialog was open, via capture-phase input/change on the wrapper below —
  // cheaper than plumbing form state up from ServiceEnquiryForm. Reset on
  // every open so a previous fill doesn't linger.
  const dirty = useRef(false);

  function openDialog() {
    dirty.current = false;
    setOpen(true);
  }

  // Gates the backdrop click / Escape / Close button (see Modal's
  // confirmClose): only nags when there's actually something to lose.
  // The success panel's own "Close" button calls setOpen(false) directly,
  // bypassing this entirely, since that's a deliberate close, not an
  // accidental one.
  function confirmClose() {
    return !dirty.current || window.confirm("You have unsaved enquiry details. Close this form and discard them?");
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>{label}</button>
      <Modal open={open} onClose={() => setOpen(false)} confirmClose={confirmClose}>
        <div onInputCapture={() => { dirty.current = true; }} onChangeCapture={() => { dirty.current = true; }}>
          <ServiceEnquiryForm services={[service]} lockedServiceId={service.id} subService={subService} onDone={() => setOpen(false)} />
        </div>
      </Modal>
    </>
  );
}
