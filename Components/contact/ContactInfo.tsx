import {
  FaLocationDot,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa6";

export default function ContactInfo() {
  return (
    <div className="rounded-2xl bg-slate-50 p-8">

      <h2 className="mb-8 text-3xl font-bold">
        Contact Information
      </h2>

      <div className="space-y-8">

        <div className="flex gap-4">
          <FaLocationDot className="mt-1 text-[#0E4A7B]" />

          <div>
            <h3 className="font-semibold">
              Office
            </h3>

            <p>
              Banjara Hills,
              Hyderabad,
              Telangana
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <FaPhone className="mt-1 text-[#0E4A7B]" />

          <div>
            <h3 className="font-semibold">
              Phone
            </h3>

            <p>+91 XXXXX XXXXX</p>
          </div>
        </div>

        <div className="flex gap-4">
          <FaEnvelope className="mt-1 text-[#0E4A7B]" />

          <div>
            <h3 className="font-semibold">
              Email
            </h3>

            <p>info@2yardsstudios.com</p>
          </div>
        </div>

      </div>

    </div>
  );
}