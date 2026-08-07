import {
  FaCheckCircle,
  FaDatabase,
  FaGlobe,
  FaCode,
  FaClock,
} from "react-icons/fa";

import DashboardPanel from "./DashboardPanel";

interface Props {
  status: {
    database: string;
    environment: string;
    website: string;
    framework: string;
    lastUpdated: Date;
  };
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

export default function SystemStatus({ status }: Props) {
  const rows = [
    {
      icon: <FaDatabase className="text-green-600" />,
      label: "Database",
      value: status.database,
    },
    {
      icon: <FaCheckCircle className="text-green-600" />,
      label: "Environment",
      value: status.environment,
    },
    {
      icon: <FaGlobe className="text-green-600" />,
      label: "Website",
      value: status.website,
    },
    {
      icon: <FaCode className="text-blue-600" />,
      label: "Framework",
      value: status.framework,
    },
    {
      icon: <FaClock className="text-orange-500" />,
      label: "Last Update",
      value: timeAgo(status.lastUpdated),
    },
  ];

  return (
    <DashboardPanel
      title="System Status"
      subtitle="Current application health"
    >
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
          >
            <div className="flex items-center gap-3">
              {row.icon}

              <span className="font-medium text-slate-700">
                {row.label}
              </span>
            </div>

            <span className="text-sm font-semibold text-slate-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}