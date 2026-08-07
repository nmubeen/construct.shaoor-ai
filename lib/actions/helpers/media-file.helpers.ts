import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/utils/file";

async function hasEntityReference(fileUrl: string) {
  const [
    projectCount,
    projectGalleryCount,
    galleryCoverCount,
    serviceCount,
    teamCount,
    clientCount,
    testimonialCount,
    seoPageCount,
    seoSettingsCount,
  ] = await Promise.all([
    prisma.project.count({ where: { coverImage: fileUrl } }),
    prisma.projectGallery.count({ where: { image: fileUrl } }),
    prisma.gallery.count({ where: { coverImage: fileUrl } }),
    prisma.service.count({ where: { image: fileUrl } }),
    prisma.teamMember.count({ where: { photo: fileUrl } }),
    prisma.client.count({ where: { logo: fileUrl } }),
    prisma.testimonial.count({ where: { photo: fileUrl } }),
    prisma.seoPage.count({ where: { ogImage: fileUrl } }),
    prisma.seoSettings.count({
      where: {
        OR: [
          { defaultOgImage: fileUrl },
          { favicon: fileUrl },
          { appleTouchIcon: fileUrl },
        ],
      },
    }),
  ]);

  return (
    projectCount +
      projectGalleryCount +
      galleryCoverCount +
      serviceCount +
      teamCount +
      clientCount +
      testimonialCount +
      seoPageCount +
      seoSettingsCount >
    0
  );
}

export async function deleteFileIfOrphaned(fileUrl: string | null | undefined) {
  const normalizedUrl = (fileUrl ?? "").trim();

  if (!normalizedUrl) {
    return;
  }

  const mediaExists = await prisma.media.findFirst({
    where: {
      OR: [{ url: normalizedUrl }, { thumbnailUrl: normalizedUrl }],
    },
    select: { id: true },
  });

  if (mediaExists) {
    return;
  }

  const stillReferenced = await hasEntityReference(normalizedUrl);

  if (stillReferenced) {
    return;
  }

  await deleteUploadedFile(normalizedUrl);
}
