import { Suspense } from "react";

import { EmailOtpForm } from "@/components/auth/EmailOtpForm";

export default function ConstructLoginPage() {
  return (
    <Suspense>
      <EmailOtpForm />
    </Suspense>
  );
}
