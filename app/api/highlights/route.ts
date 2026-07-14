import { NextResponse } from "next/server";
import { addHighlight } from "@/lib/actions/highlight.actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    await addHighlight(
      body.projectId,
      body.title
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
            : "Unable to add highlight.",
      },
      { status: 500 }
    );
  }
}