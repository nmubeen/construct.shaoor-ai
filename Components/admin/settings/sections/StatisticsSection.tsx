import { Settings } from "@prisma/client";

import NumberField from "@/components/admin/fields/NumberField";
import AdminSection from "@/components/admin/layout/AdminSection";

interface Props {
  settings: Settings;
}

export default function StatisticsSection({ settings }: Props) {
  return (
    <AdminSection
      title="Company Statistics"
      description="Business metrics displayed across the website."
    >
      <NumberField
        label="Projects"
        name="projectsCompleted"
        defaultValue={settings.projectsCompleted}
      />

      <NumberField
        label="Clients"
        name="clientsServed"
        defaultValue={settings.clientsServed}
      />

      <NumberField
        label="Years"
        name="yearsExperience"
        defaultValue={settings.yearsExperience}
      />

      <NumberField
        label="Employees"
        name="employees"
        defaultValue={settings.employees}
      />
    </AdminSection>
  );
}