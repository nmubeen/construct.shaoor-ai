import Image from "next/image";
import Link from "next/link";

import { websiteDesign } from "@/components/website/shared/design";

export interface Project {
  id: string | number;
  slug: string;
  title: string;
  category: string;
  location: string;
  coverImage: string;
  status: string;
}

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group ${websiteDesign.card} transition-all`}
    >
      <div className="relative h-64 overflow-hidden">
        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-6">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {project.status}
        </span>

        <h3 className="mt-4 text-2xl font-semibold">
          {project.title}
        </h3>

        <p className="mt-2 text-slate-600">
          {project.category}
        </p>

        <p className="text-sm text-slate-500">
          {project.location}
        </p>
      </div>
    </Link>
  );
}
