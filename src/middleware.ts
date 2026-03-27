export { auth as middleware } from "@/lib/auth";

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
