interface SaveBarProps {
  text?: string;
}

export default function SaveBar({
  text = "Save Changes",
}: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 mt-8 border-t border-slate-200 bg-white px-6 py-4">
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-primary px-8 py-3 font-medium text-white transition hover:opacity-90"
        >
          {text}
        </button>
      </div>
    </div>
  );
}