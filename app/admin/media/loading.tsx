export default function MediaLoading() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-64 rounded bg-slate-200" />
        <div className="h-28 rounded-xl bg-slate-200" />
        <div className="h-80 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
