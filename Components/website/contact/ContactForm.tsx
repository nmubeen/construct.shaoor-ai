"use client";

export default function ContactForm() {
  return (
    <form className="space-y-6">

      <div>
        <label className="mb-2 block font-medium">
          Name
        </label>

        <input
          type="text"
          className="w-full rounded-lg border border-slate-300 p-3 focus:border-[#0E4A7B] focus:outline-none"
          placeholder="Your Name"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Email
        </label>

        <input
          type="email"
          className="w-full rounded-lg border border-slate-300 p-3 focus:border-[#0E4A7B] focus:outline-none"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Phone
        </label>

        <input
          type="text"
          className="w-full rounded-lg border border-slate-300 p-3 focus:border-[#0E4A7B] focus:outline-none"
          placeholder="+91 XXXXX XXXXX"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Service Required
        </label>

        <select className="w-full rounded-lg border border-slate-300 p-3">
          <option>Architecture</option>
          <option>Construction</option>
          <option>Interior Design</option>
          <option>Renovation</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Message
        </label>

        <textarea
          rows={6}
          className="w-full rounded-lg border border-slate-300 p-3 focus:border-[#0E4A7B] focus:outline-none"
          placeholder="Tell us about your project..."
        />
      </div>

      <button
        className="rounded-lg bg-[#0E4A7B] px-8 py-4 font-semibold text-white hover:bg-blue-900"
      >
        Send Enquiry
      </button>

    </form>
  );
}