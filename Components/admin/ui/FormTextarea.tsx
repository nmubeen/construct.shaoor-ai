interface FormTextareaProps {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}

export default function FormTextarea({
  label,
  name,
  defaultValue,
  rows = 4,
}: FormTextareaProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}