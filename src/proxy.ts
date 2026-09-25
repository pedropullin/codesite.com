import { NextResponse, type NextRequest } from "next/server";

// radar.<domain> serves the Radar app at its root, so it works as a standalone site.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host.startsWith("radar.")) return;
  const url = request.nextUrl.clone();
  url.pathname = "/radar";
  return NextResponse.rewrite(url);
}

export const config = { matcher: "/" };
