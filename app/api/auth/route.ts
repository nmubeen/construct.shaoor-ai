export const runtime = "nodejs";

export async function GET(request: Request) {
  return new Response("Auth API", { status: 200 });
}

export async function POST(request: Request) {
  return new Response("Auth API", { status: 200 });
}
