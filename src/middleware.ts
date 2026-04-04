import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // New OAuth user redirect — send to profile setup
  const isNewOAuth = request.cookies.get("new_oauth_user")?.value === "1";
  if (isNewOAuth && pathname !== "/profile/edit") {
    const response = NextResponse.redirect(new URL("/profile/edit", request.url));
    response.cookies.delete("new_oauth_user");
    return response;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/board/new",
    "/profile/edit",
    "/dashboard",
    "/dashboard/:path*",
    "/chat",
    "/chat/:path*",
  ],
};
