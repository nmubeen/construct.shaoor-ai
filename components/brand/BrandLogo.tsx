import Image from "next/image";

// The Shaoor-AI Construct mark on a fixed 60x60 white tile with 10px corners.
// The PNG is transparent, so the white tile keeps it legible on the dark
// gradient chrome.
export function BrandLogo() {
  return (
    <span className="inline-flex size-15 shrink-0 items-center justify-center rounded-[10px] bg-white p-1 shadow-md">
      <Image
        src="/images/brand/shaoor-ai-construct-standard.png"
        alt="Shaoor-AI Construct"
        width={52}
        height={52}
        className="size-13 object-contain"
      />
    </span>
  );
}
