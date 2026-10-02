import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gatePassword, isValidToken } from "@/lib/passwordGate";
import { REPO_URL, isSiteOnly } from "@/lib/siteOnly";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hostnameOf(host: string): string {
  return host.replace(/:\d+$/, "").toLowerCase();
}

/**
 * CopyDogg has no accounts. Without COPYDOGG_PASSWORD it is a localhost tool,
 * so it only answers to localhost names: that stops other websites from
 * reaching it through DNS rebinding. With a password set, the cookie is what
 * keeps strangers out, and any host name is fine.
 */
export function proxy(request: NextRequest) {
  // Public intro site: the landing page and static files only. No writes
  // (that includes server actions), and the app itself lives on GitHub.
  if (isSiteOnly) {
    if (!READ_ONLY_METHODS.has(request.method)) {
      return new NextResponse("This is the CopyDogg website. Run your own copy to use the app.", { status: 405 });
    }
    if (/^\/(app|onboarding|unlock|api)(\/|$)/.test(request.nextUrl.pathname)) {
      return NextResponse.redirect(REPO_URL);
    }
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const password = gatePassword();

  if (!password && !LOCAL_HOSTNAMES.has(hostnameOf(host))) {
    return new NextResponse("CopyDogg only answers on localhost. Set COPYDOGG_PASSWORD to use another address.", {
      status: 403,
    });
  }

  // A page on another site must not be able to write to this one.
  const origin = request.headers.get("origin");
  if (origin && !READ_ONLY_METHODS.has(request.method)) {
    const expected = request.headers.get("x-forwarded-host") ?? host;
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {}
    if (originHost !== expected) {
      return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
    }
  }

  if (!password) return NextResponse.next();

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
