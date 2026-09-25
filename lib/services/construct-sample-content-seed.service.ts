import "server-only";

import { seedConstructDefaultServiceAtIndex, startConstructDefaultServiceSeed } from "@/lib/services/construct-service-seed.service";
import { seedConstructDefaultProjectAtIndex, startConstructDefaultProjectSeed } from "@/lib/services/construct-project-seed.service";

// The one entry point for "give a brand-new organization starter content":
// 15 default services (with sub-services and enquiry questions) plus the 2
// sample projects, so a tenant's dashboard and public site aren't empty
// the moment they finish account setup. Reuses the exact same per-item
// step functions the dashboard's manual "Seed default services" button
// drives (lib/services/construct-service-seed.service.ts /
// construct-project-seed.service.ts) — this is not a separate seed, just
// a second caller of the same idempotent-by-slug steps, run back-to-back
// instead of one at a time from the browser.
//
// Called from createConstructOrganizationForCurrentUser (see
// lib/auth/provisioning.ts) right after the organization/membership/
// subscription transaction commits, best-effort: a seeding failure must
// never block account setup, the same tolerance already given to the
// control-plane subscription sync it sits next to. A step that fails
// partway leaves whatever was already created in place (same recovery
// story as the manual button) rather than rolling anything back — the
// owner can always retry from the empty-state button afterward for
// anything the account-setup pass didn't finish.
export async function seedConstructDefaultContentForNewOrganization(organizationId: string): Promise<void> {
  const serviceStart = await startConstructDefaultServiceSeed(organizationId);
  if (serviceStart.started) {
    for (let index = 0; index < serviceStart.total; index += 1) {
      const result = await seedConstructDefaultServiceAtIndex(organizationId, index);
      if (!result.ok) {
        console.error(`Default content seeding: services stopped at step ${index + 1}/${serviceStart.total}: ${result.error}`);
        break;
      }
    }
  }

  const projectStart = await startConstructDefaultProjectSeed(organizationId);
  if (projectStart.started) {
    for (let index = 0; index < projectStart.total; index += 1) {
      const result = await seedConstructDefaultProjectAtIndex(organizationId, index);
      if (!result.ok) {
        console.error(`Default content seeding: projects stopped at step ${index + 1}/${projectStart.total}: ${result.error}`);
        break;
      }
    }
  }
}
