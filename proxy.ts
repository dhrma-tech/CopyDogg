import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gatePassword, isValidToken } from "@/lib/passwordGate";

/**
 * CopyDogg has no accounts. This only does something when COPYDOGG_PASSWORD
 * is set — for anyone running their copy somewhere other people could reach.
 */
export function proxy(request: NextRequest) {
  if (!gatePassword()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname === "/unlock") return NextResponse.next();
  if (isValidToken(request.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked. Enter the password first." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
