"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "@/Components/UI/Container";

const menuItems = [
  { label: "Home", href: "/" },
  { label: "Studio", href: "/studio" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects/completed" },
  { label: "Our Process", href: "/process" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <Container className="flex h-20 items-center justify-between">

        <Link href="/">
          <Image
  src="/images/logo/logo.png"
  alt="2 Yards Studios"
  width={170}
  height={60}
  priority
  style={{ width: "auto", height: "auto" }}
/>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-[#0E4A7B]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

      </Container>
    </header>
  );
}