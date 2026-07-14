import { NextResponse } from "next/server";
import { deleteHighlight } from "@/lib/actions/highlight.actions";

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

    await deleteHighlight(Number(id));

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
            : "Unable to delete highlight.",
      },
      { status: 500 }
    );
  }
}