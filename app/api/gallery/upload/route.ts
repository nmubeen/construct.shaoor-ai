import { NextResponse } from "next/server";

import { uploadProjectImage } from "@/lib/actions/upload.actions";
import { addGalleryImage } from "@/lib/actions/gallery.actions";

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const file = formData.get("file");

    const projectId = Number(
      formData.get("projectId")
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 400,
        }
      );
    }

    const image =
      await uploadProjectImage(file);

    await addGalleryImage(
      projectId,
      image
    );

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
            : "Upload failed.",
      },
      {
        status: 500,
      }
    );
  }
}