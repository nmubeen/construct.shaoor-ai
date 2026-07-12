import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.project.deleteMany();

  await prisma.project.create({
    data: {
      slug: "luxury-villa",
      title: "Luxury Villa",
      category: "Residential",
      status: "Completed",
      client: "Private Client",
      location: "Hyderabad",
      year: 2025,
      duration: "14 Months",
      budget: "₹2.4 Cr",
      area: "5800 sq ft",
      coverImage: "/images/projects/project1.jpg",
      description:
        "A contemporary luxury villa designed with open spaces and premium finishes.",
      featured: true,

      highlights: {
        create: [
          { text: "Smart Home" },
          { text: "Solar Powered" },
          { text: "Landscape Garden" },
        ],
      },

      gallery: {
        create: [
          { image: "/images/projects/project1.jpg" },
          { image: "/images/projects/project1.jpg" },
          { image: "/images/projects/project1.jpg" },
        ],
      },
    },
  });

  console.log("✅ Database seeded successfully.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });