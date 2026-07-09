"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import Container from "@/Components/UI/Container";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/">
          <Image
            src="/images/logo/logo.png"
            alt={siteConfig.name}
            width={170}
            height={60}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/">Home</Link>
          <Link href="/studio">Studio</Link>
          <Link href="/services">Services</Link>
          <Link href="/projects/completed">Projects</Link>
          <Link href="/process">Our Process</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </Container>
    </header>
  );
}