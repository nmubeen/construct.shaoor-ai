import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">

      <Container>

        <div className="grid gap-12 py-16 md:grid-cols-3">

          {/* Company */}

          <div>

            <h3 className="mb-5 text-2xl font-bold text-white">
              SAM Constructions
            </h3>

            <p className="leading-7">
              Architecture, Construction and Interior Design.
              Creating timeless spaces through thoughtful
              planning and exceptional execution.
            </p>

          </div>

          {/* Quick Links */}

          <div>

            <h4 className="mb-5 text-xl font-semibold text-white">
              Quick Links
            </h4>

            <div className="flex flex-col gap-3">

              <Link href="/">Home</Link>
              <Link href="/studio">Studio</Link>
              <Link href="/services">Services</Link>
              <Link href="/projects/completed">
                Projects
              </Link>
              <Link href="/contact">Contact</Link>

            </div>

          </div>

          {/* Contact */}

          <div>

            <h4 className="mb-5 text-xl font-semibold text-white">
              Contact
            </h4>

            <div className="space-y-3">

              <p>Banjara Hills, Hyderabad</p>

              <p>+91 XXXXX XXXXX</p>

              <p>nmubeen@gmail.com</p>

            </div>

          </div>

        </div>

        <div className="border-t border-slate-700 py-6 text-center text-sm">

          © {new Date().getFullYear()} SAM Constructions.
          All Rights Reserved.

        </div>

      </Container>
    </footer>
  );
}