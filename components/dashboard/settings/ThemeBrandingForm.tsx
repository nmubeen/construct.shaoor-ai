"use client";

import { useRef, useState } from "react";
import { Palette, Sparkles, Upload } from "lucide-react";
import { updateConstructThemeAction } from "@/lib/actions/construct-settings.actions";
import { DEFAULT_SITE_THEME } from "@/lib/theme";

// Quantizes a pixel's channels to the nearest 24 so near-identical shades
// (JPEG noise, anti-aliasing) collapse into the same bucket instead of
// each counting as its own color.
function quantize(value: number) {
  return Math.round(value / 24) * 24;
}

// Distance in RGB space — used to keep the two suggested colors visually
// distinct from each other, not two shades of the same thing.
function colorDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Best-effort dominant-color extraction, entirely client-side (no upload,
// no external API): draws the picked image to an offscreen canvas, buckets
// pixels by quantized color, and returns the two most common buckets far
// enough apart to read as "primary" and "accent" rather than two shades of
// the same color. Skips near-white/near-black/near-gray and low-alpha
// pixels, since those are almost always background or transparency rather
// than the logo's actual brand colors.
function extractPaletteFromImage(image: HTMLImageElement): [string, string] | null {
  const canvas = document.createElement("canvas");
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, size, size);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return null; // canvas tainted by a cross-origin image with no CORS headers
  }

  const buckets = new Map<string, { count: number; rgb: [number, number, number] }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isNearWhite = min > 225;
    const isNearBlack = max < 30;
    const isGray = max - min < 18; // low saturation — not a brand color
    if (isNearWhite || isNearBlack || isGray) continue;
    const key = `${quantize(r)},${quantize(g)},${quantize(b)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
    else buckets.set(key, { count: 1, rgb: [quantize(r), quantize(g), quantize(b)] });
  }

  const sorted = [...buckets.values()].sort((x, y) => y.count - x.count);
  if (sorted.length === 0) return null;

  const primary = sorted[0].rgb;
  const accent = sorted.find((bucket) => colorDistance(bucket.rgb, primary) > 60)?.rgb;
  // A logo with one dominant color: derive a lighter tint as the accent
  // rather than reusing the exact same hex for both.
  const fallbackAccent: [number, number, number] = accent ?? [
    Math.min(255, primary[0] + 60),
    Math.min(255, primary[1] + 60),
    Math.min(255, primary[2] + 60),
  ];
  return [toHex(primary), toHex(fallbackAccent)];
}

export function ThemeBrandingForm({
  currentPrimary,
  currentAccent,
  logoUrl,
}: {
  currentPrimary: string | null;
  currentAccent: string | null;
  logoUrl: string | null;
}) {
  const [primary, setPrimary] = useState(currentPrimary ?? DEFAULT_SITE_THEME.primary);
  const [accent, setAccent] = useState(currentAccent ?? DEFAULT_SITE_THEME.accent);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function runSuggestion(source: string) {
    setSuggestError(null);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const palette = extractPaletteFromImage(image);
      if (!palette) {
        setSuggestError("Could not find distinct colors in that image — try a more colorful logo, or pick colors manually.");
        return;
      }
      setPrimary(palette[0]);
      setAccent(palette[1]);
    };
    image.onerror = () => setSuggestError("Could not load that image.");
    image.src = source;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    runSuggestion(URL.createObjectURL(file));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Palette className="size-5 text-[#7D9D76]" />
        <h2 className="font-bold">Website theme</h2>
      </div>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        Choose the two colors your public website uses for its header, footer, buttons and accents. This only
        affects your own website — not this dashboard.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-[#7D9D76] px-3 py-2 text-xs font-semibold text-[#094136] hover:bg-[#eef3ec]"
        >
          <Upload className="size-3.5" />
          Suggest from a logo or graphic
        </button>
        {logoUrl && (
          <button
            type="button"
            onClick={() => runSuggestion(logoUrl)}
            className="inline-flex items-center gap-2 rounded-md border border-[#7D9D76] px-3 py-2 text-xs font-semibold text-[#094136] hover:bg-[#eef3ec]"
          >
            <Sparkles className="size-3.5" />
            Suggest from current logo
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
      {suggestError && <p className="mb-4 text-xs text-amber-700">{suggestError}</p>}

      <form action={updateConstructThemeAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">
            Primary color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-md border border-slate-300"
                aria-label="Primary color picker"
              />
              <input
                name="themePrimaryColor"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal uppercase"
              />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Accent color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-md border border-slate-300"
                aria-label="Accent color picker"
              />
              <input
                name="themeAccentColor"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal uppercase"
              />
            </div>
          </label>
        </div>

        <div
          className="flex flex-wrap items-center gap-3 rounded-md border p-4"
          style={{ borderColor: accent, background: "linear-gradient(to bottom, " + primary + ", black)" }}
        >
          <span className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: primary }}>
            Header preview
          </span>
          <span className="text-xs font-bold uppercase tracking-[.2em]" style={{ color: accent }}>
            Sub-heading preview
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-md bg-[#094136] px-4 py-2.5 text-sm font-semibold text-white">
            Save theme
          </button>
          <button
            type="button"
            onClick={() => {
              setPrimary(DEFAULT_SITE_THEME.primary);
              setAccent(DEFAULT_SITE_THEME.accent);
            }}
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset to Shaoor defaults
          </button>
        </div>
      </form>
    </section>
  );
}
