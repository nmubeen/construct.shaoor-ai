
import type { Project } from "@/Types/projects";

export const projects: Project[] = [
  {
    id: 1,
    slug: "luxury-villa",
    title: "Luxury Villa",
    location: "Hyderabad",
    category: "Residential",
    status: "Completed",
    client: "Private Client",
    year: 2025,
    duration: "14 Months",
    budget: "₹2.4 Cr",
    area: "5,800 sq ft",
    coverImage: "/images/projects/project1.jpg",

gallery: [
  "/images/projects/project1.jpg",
  "/images/projects/project1-2.jpg",
  "/images/projects/project1-3.jpg",
],
    description:
      "A contemporary luxury villa designed with open spaces, natural lighting, premium finishes, and smart home automation.",
    highlights: [
      "Contemporary Architecture",
      "Smart Home Automation",
      "Landscape Garden",
      "Solar Power System",
    ],
  },
  {
    id: 2,
    slug: "corporate-office",
    title: "Corporate Office",
    location: "Hyderabad",
    category: "Commercial",
    status: "Completed",
    client: "ABC Technologies",
    year: 2024,
    duration: "10 Months",
    budget: "₹5.8 Cr",
    area: "18,000 sq ft",
    coverImage: "/images/projects/project2.jpg",

gallery: [
  "/images/projects/project2.jpg",
  "/images/projects/project2-2.jpg",
  "/images/projects/project2-3.jpg",
],
    description:
      "A modern corporate office designed to encourage collaboration while maintaining an elegant professional environment.",
    highlights: [
      "Open Office Layout",
      "Energy Efficient Design",
      "Premium Interiors",
      "LEED Ready",
    ],
  },
  {
    id: 3,
    slug: "premium-apartments",
    title: "Premium Apartments",
    location: "Hyderabad",
    category: "Residential",
    status: "Ongoing",
    client: "XYZ Developers",
    year: 2026,
    duration: "24 Months",
    budget: "₹32 Cr",
    area: "1.5 Acres",
    coverImage: "/images/projects/project3.jpg",

gallery: [
  "/images/projects/project3.jpg",
  "/images/projects/project3-2.jpg",
  "/images/projects/project3-3.jpg",
],
    description:
      "A premium apartment development featuring modern amenities, landscaped open spaces, and sustainable construction practices.",
    highlights: [
      "Swimming Pool",
      "Club House",
      "Children's Play Area",
      "Green Building Features",
    ],
  },
];