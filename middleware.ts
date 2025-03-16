import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";

// Define paths that need authentication
const protectedPaths = ["/admin", "/admin/match", "/admin/match/"];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if path is admin route but not the login page
	if (pathname.startsWith("/admin")) {
		// Check if protected path or has dynamic segments (which could be match ID paths)
		const needsAuth =
			protectedPaths.includes(pathname) || (pathname.startsWith("/admin/match/") && pathname !== "/admin/match");

		if (needsAuth) {
			const isAuthenticated = request.cookies.has("admin_authenticated");

			if (!isAuthenticated) {
				// Redirect to admin login if not authenticated
				const url = request.nextUrl.clone();
				url.pathname = "/admin/login";
				url.searchParams.set("from", request.nextUrl.pathname);
				return NextResponse.redirect(url);
			}
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"]
};
