interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: Props) {
  return (
    <div className="mb-14 text-center">
      {subtitle && (
        <p className="mb-3 uppercase tracking-[4px] text-sm text-[#0E4A7B]">
          {subtitle}
        </p>
      )}

      <h2 className="text-4xl font-bold text-slate-900">
        {title}
      </h2>
    </div>
  );
}