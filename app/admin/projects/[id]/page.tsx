import EmptyState from "@/components/admin/EmptyState";
import PageTitle from "@/components/admin/PageTitle";

export default function ProjectDetailsPage() {
	return (
		<>
			<PageTitle title="Project Details" />

			<EmptyState
				title="No Project Data"
				description="Project details will be shown here once connected to the database."
			/>
		</>
	);
}
