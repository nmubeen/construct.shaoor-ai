"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [
    projects,

    services,
    activeServices,

    team,
    activeTeam,

    clients,
    activeClients,

    testimonials,
    activeTestimonials,

    faqs,
    activeFaqs,

    messages,
    unreadMessages,

    recentMessages,
    recentProjects,

    recentTestimonials,
    recentTeamMembers,
    recentFaqs,
  ] = await Promise.all([
    // Counts
    prisma.project.count(),

    prisma.service.count(),
    prisma.service.count({
      where: {
        isActive: true,
      },
    }),

    prisma.teamMember.count(),
    prisma.teamMember.count({
      where: {
        isActive: true,
      },
    }),

    prisma.client.count(),
    prisma.client.count({
      where: {
        active: true,
      },
    }),

    prisma.testimonial.count(),
    prisma.testimonial.count({
      where: {
        active: true,
      },
    }),

    prisma.fAQ.count(),
    prisma.fAQ.count({
      where: {
        active: true,
      },
    }),

    prisma.message.count(),
    prisma.message.count({
      where: {
        isRead: false,
      },
    }),

    // Recent Messages
    prisma.message.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        subject: true,
        isRead: true,
        createdAt: true,
      },
    }),

    // Recent Projects
    prisma.project.findMany({
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        client: true,
        status: true,
        updatedAt: true,
      },
    }),

    // Recent Testimonials
    prisma.testimonial.findMany({
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        clientName: true,
        updatedAt: true,
      },
    }),

    // Recent Team
    prisma.teamMember.findMany({
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    }),

    // Recent FAQs
    prisma.fAQ.findMany({
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        question: true,
        updatedAt: true,
      },
    }),
  ]);

  // Check database connectivity
  let databaseStatus = "Connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "Disconnected";
  }

  const activityTimeline = [
    ...recentMessages.map((m) => ({
      id: `message-${m.id}`,
      type: "message" as const,
      title: m.name,
      description: m.subject ?? "New enquiry received",
      date: m.createdAt,
      href: `/admin/messages/${m.id}`,
    })),

    ...recentProjects.map((p) => ({
      id: `project-${p.id}`,
      type: "project" as const,
      title: p.title,
      description: `${p.client} • ${p.status}`,
      date: p.updatedAt,
      href: `/admin/projects/${p.id}/edit`,
    })),

    ...recentTestimonials.map((t) => ({
      id: `testimonial-${t.id}`,
      type: "testimonial" as const,
      title: t.clientName,
      description: "Testimonial updated",
      date: t.updatedAt,
      href: "/admin/testimonials",
    })),

    ...recentTeamMembers.map((t) => ({
      id: `team-${t.id}`,
      type: "team" as const,
      title: t.name,
      description: "Team member updated",
      date: t.updatedAt,
      href: "/admin/team",
    })),

    ...recentFaqs.map((f) => ({
      id: `faq-${f.id}`,
      type: "faq" as const,
      title: f.question,
      description: "FAQ updated",
      date: f.updatedAt,
      href: "/admin/faqs",
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const latestDates = [
    ...recentProjects.map((p) => p.updatedAt),
    ...recentTestimonials.map((t) => t.updatedAt),
    ...recentTeamMembers.map((t) => t.updatedAt),
    ...recentFaqs.map((f) => f.updatedAt),
    ...recentMessages.map((m) => m.createdAt),
  ];

  const lastUpdated =
    latestDates.length > 0
      ? new Date(
          Math.max(...latestDates.map((date) => new Date(date).getTime()))
        )
      : new Date();

  return {
    stats: {
      projects,

      services,
      activeServices,

      team,
      activeTeam,

      clients,
      activeClients,

      testimonials,
      activeTestimonials,

      faqs,
      activeFaqs,

      messages,
      unreadMessages,
    },

    recentMessages,

    recentProjects,

    activityTimeline,

    systemStatus: {
      database: databaseStatus,
      environment:
        process.env.NODE_ENV === "production"
          ? "Production"
          : "Development",
      website: "Online",
      framework: "Next.js 16",
      lastUpdated,
    },
  };
}