"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// Pure CSS radio-button star pickers are the usual trick for this, but
// they render highest-to-lowest in the DOM to make the `~` sibling
// selector work, which reverses tab order — not worth it for a 5-item
// scale. Plain client state instead.
export function StarRatingField({ name, defaultValue = 5, hint }: { name: string; defaultValue?: number; hint?: string }) {
  const [rating, setRating] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? rating;

  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      Rating
      {hint && <span className="text-[11px] font-normal normal-case text-slate-500">{hint}</span>}
      <input type="hidden" name={name} value={rating} />
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            className="rounded p-0.5"
          >
            <Star
              className="size-6 text-[#7D9D76]"
              fill={value <= shown ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    </label>
  );
}
