interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="mb-10">
      <h1 className="text-4xl font-bold text-(--foreground)">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-3xl text-lg text-(--muted)">
          {description}
        </p>
      )}
    </div>
  );
}