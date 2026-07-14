import { NextResponse } from "next/server";
import { deleteGalleryImage } from "@/lib/actions/gallery.actions";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;

    await deleteGalleryImage(Number(id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Delete failed.",
      },
      {
        status: 500,
      }
    );
  }
}