export interface Project {
  id: number;
  slug: string;
  title: string;
  location: string;
  category: string;
  status: "Completed" | "Ongoing";
  client: string;
  year: number;
  duration: string;
  budget: string;
  area: string;

  coverImage: string;
  gallery: string[];

  description: string;

  highlights: string[];
}