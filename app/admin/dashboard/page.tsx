export default async function DashboardPage() {
  return (
    <>
      <h1 className="mb-10 text-4xl font-bold">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl bg-white p-8 shadow">

          <h3 className="text-lg font-semibold">
            Projects
          </h3>

          <p className="mt-3 text-4xl font-bold">
            0
          </p>

        </div>

        <div className="rounded-xl bg-white p-8 shadow">

          <h3 className="text-lg font-semibold">
            Ongoing
          </h3>

          <p className="mt-3 text-4xl font-bold">
            0
          </p>

        </div>

        <div className="rounded-xl bg-white p-8 shadow">

          <h3 className="text-lg font-semibold">
            Messages
          </h3>

          <p className="mt-3 text-4xl font-bold">
            0
          </p>

        </div>

        <div className="rounded-xl bg-white p-8 shadow">

          <h3 className="text-lg font-semibold">
            Featured
          </h3>

          <p className="mt-3 text-4xl font-bold">
            0
          </p>

        </div>

      </div>
    </>
  );
}