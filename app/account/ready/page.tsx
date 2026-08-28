import { redirect } from "next/navigation";

// Compatibility route retained for bookmarks created during the auth rollout.
export default function WorkspaceReadyPage() {
  redirect("/dashboard");
}
