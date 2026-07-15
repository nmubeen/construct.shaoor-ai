interface FormNumberProps {
  label: string;
  name: string;
  defaultValue?: number | null;
}

export default function FormNumber({
  label,
  name,
  defaultValue,
}: FormNumberProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="number"
        defaultValue={defaultValue ?? 0}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}