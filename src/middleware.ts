import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RUTAS_HOSTS = new Set(["rutas.dorsalia.run", "rutas.localhost"]);

function withChromeOff(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-dorsalia-chrome", "off");
  return headers;
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;
  if (pathname === "/cuenta" && request.nextUrl.searchParams.get("tab") === "historial") {
    const target = request.nextUrl.clone(); target.pathname = "/miscompras"; target.searchParams.delete("tab");
    return NextResponse.redirect(target);
  }
  if (pathname.startsWith("/cuenta/cupones/")) {
    const target=request.nextUrl.clone(); target.pathname=pathname.replace("/cuenta/cupones/","/miscompras/cupones/");
    return NextResponse.redirect(target);
  }
  const isRutasHost = RUTAS_HOSTS.has(host);
  const isRutasPath = pathname === "/rutas" || pathname.startsWith("/rutas/");

  if (isRutasHost && (pathname === "/" || pathname === "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/rutas";
    return NextResponse.rewrite(url, { request: { headers: withChromeOff(request) } });
  }

  if (isRutasHost || isRutasPath) {
    return NextResponse.next({ request: { headers: withChromeOff(request) } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/rutas", "/rutas/:path*", "/cuenta", "/cuenta/:path*"],
};
