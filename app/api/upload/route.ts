import { NextResponse } from "next/server";
import { uploadProjectImage } from "@/lib/actions/upload.actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No file received.",
        },
        {
          status: 400,
        }
      );
    }

    const imagePath = await uploadProjectImage(file);

    return NextResponse.json({
      success: true,
      path: imagePath,
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