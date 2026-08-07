import { stringifyJsonLd } from "@/lib/schema";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: stringifyJsonLd(data),
      }}
    />
  );
}
