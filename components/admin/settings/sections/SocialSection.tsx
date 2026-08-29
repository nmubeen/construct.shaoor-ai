import { Settings } from "@prisma/client";

import TextField from "@/components/admin/fields/TextField";
import AdminSection from "@/components/admin/layout/AdminSection";

interface Props {
  settings: Settings;
}

export default function SocialSection({ settings }: Props) {
  return (
    <AdminSection
      title="Social Media"
      description="Links to the company's social platforms."
    >
      <TextField
        label="Facebook"
        name="facebook"
        defaultValue={settings.facebook ?? ""}
      />

      <TextField
        label="Instagram"
        name="instagram"
        defaultValue={settings.instagram ?? ""}
      />

      <TextField
        label="LinkedIn"
        name="linkedin"
        defaultValue={settings.linkedin ?? ""}
      />

      <TextField
        label="X / Twitter"
        name="twitter"
        defaultValue={settings.twitter ?? ""}
      />

      <TextField
        label="YouTube"
        name="youtube"
        defaultValue={settings.youtube ?? ""}
      />
    </AdminSection>
  );
}