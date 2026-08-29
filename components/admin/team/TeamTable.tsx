import Image from "next/image";
import Link from "next/link";
import { FaPenToSquare } from "react-icons/fa6";

import DeleteTeamButton from "./DeleteTeamButton";
import StatusBadge from "@/components/admin/common/StatusBadge";

interface TeamMember {
  id: number;
  photo?: string | null;
  name: string;
  designation: string;
  isActive: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
}

interface Props {
  members: TeamMember[];
}

export default function TeamTable({ members }: Props) {
  return (
    <table className="min-w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Photo</th>
          <th className="p-4 text-left">Name</th>
          <th className="p-4 text-left">Designation</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-center">Homepage</th>
          <th className="p-4 text-center">Order</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {members.map((member) => (
          <tr key={member.id} className="border-t">
            <td className="p-4">
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={60}
                  height={60}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  No Photo
                </div>
              )}
            </td>

            <td className="p-4 font-medium">
              {member.name}
            </td>

            <td className="p-4">
              {member.designation}
            </td>

            <td className="p-4">
              <StatusBadge
                status={
                  member.isActive
                    ? "Active"
                    : "Inactive"
                }
              />
            </td>

            <td className="p-4 text-center">
              {member.showOnHomepage ? "Yes" : "No"}
            </td>

            <td className="p-4 text-center">
              {member.displayOrder}
            </td>

            <td className="p-4 text-right">
              <div className="flex justify-end gap-4">
                <Link
                  href={`/admin/team/${member.id}`}
                  className="text-slate-600 transition hover:text-[#0E4A7B]"
                  title="Edit"
                >
                  <FaPenToSquare size={18} />
                </Link>

                <DeleteTeamButton id={member.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
