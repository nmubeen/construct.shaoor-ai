import Image from "next/image";
import Link from "next/link";
import {
  FaCheckCircle,
} from "react-icons/fa";

export default function AboutPreview() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        {/* Left */}

        <div>

          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-(--primary)">
            About Us
          </span>

          <h2 className="mt-4 text-4xl font-bold leading-tight">
            Building Strong Foundations for the Future
          </h2>

          <p className="mt-6 leading-8 text-slate-600">
            SAM Constructions has earned a reputation for delivering
            high-quality residential, commercial, industrial and
            infrastructure projects through technical excellence,
            disciplined execution and long-term client relationships.
          </p>

          <div className="mt-8 space-y-4">

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                Experienced multidisciplinary team
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                Quality-driven construction practices
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                Safety-first project execution
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                On-time project delivery
              </span>
            </div>

          </div>

          <Link
            href="/about"
            className="mt-10 inline-block rounded-lg bg-(--primary) px-8 py-4 font-semibold text-white transition hover:bg-(--primary-dark)"
          >
            Learn More
          </Link>

        </div>

        {/* Right */}

        <div className="relative h-125 overflow-hidden rounded-3xl shadow-xl">

          <Image
            src="/images/about/company.jpg"
            alt="Construction Site"
            fill
            className="object-cover"
          />

        </div>

      </div>
    </section>
  );
}