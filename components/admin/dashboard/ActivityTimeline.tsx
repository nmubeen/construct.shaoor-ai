import Link from "next/link";

import {
  FaEnvelope,
  FaBuilding,
  FaUsers,
  FaQuestionCircle,
  FaStar,
  FaArrowRight,
} from "react-icons/fa";

import DashboardPanel from "./DashboardPanel";


interface ActivityItem {
  id: string;
  type:
    | "message"
    | "project"
    | "team"
    | "testimonial"
    | "faq";

  title: string;
  description: string;
  date: Date;
  href: string;
}

interface Props {
  items: ActivityItem[];
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const value = Math.floor(seconds / interval.seconds);

    if (value >= 1) {
      return `${value} ${interval.label}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

function getIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "message":
      return (
        <FaEnvelope className="text-blue-600" />
      );

    case "project":
      return (
        <FaBuilding className="text-green-600" />
      );

    case "team":
      return (
        <FaUsers className="text-purple-600" />
      );

    case "testimonial":
      return (
        <FaStar className="text-yellow-500" />
      );

    case "faq":
      return (
        <FaQuestionCircle className="text-cyan-600" />
      );
  }
}

export default function ActivityTimeline({
  items,
}: Props) {
  return (
    <DashboardPanel
      title="Activity Timeline"
      subtitle="Latest updates across the website"
    >
      <div className="space-y-5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start gap-4 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
          >
            <div className="mt-1 rounded-full bg-slate-100 p-3">
              {getIcon(item.type)}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {item.description}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {timeAgo(item.date)}
              </p>
            </div>

            <FaArrowRight className="mt-2 text-slate-400" />
          </Link>
        ))}

        {items.length === 0 && (
          <div className="py-10 text-center text-slate-500">
            No recent activity.
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}