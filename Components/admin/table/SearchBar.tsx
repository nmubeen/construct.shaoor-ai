"use client";

interface Props {
  placeholder?: string;
}

export default function SearchBar({
  placeholder = "Search...",
}: Props) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-80"
    />
  );
}