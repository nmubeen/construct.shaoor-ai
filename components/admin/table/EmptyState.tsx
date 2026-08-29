"use client";

import Link from "next/link";
import Button from "../primitives/Button";

interface Props {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

export default function EmptyState({
  title,
  description,
  buttonLabel,
  buttonHref,
}: Props) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">

      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      <p className="mt-3 text-slate-500">
        {description}
      </p>

      <Link
        href={buttonHref}
        className="mt-8 inline-block"
      >
        <Button>
          {buttonLabel}
        </Button>
      </Link>

    </div>
  );
}