import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie} from "better-auth/cookies"
import { routes } from "./lib/constants";
 
export async function middleware(request: NextRequest) {
    const session = await getSessionCookie(request, {
        cookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX
    })

    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
    if(!session && !isAuthRoute) {
        return NextResponse.redirect(new URL(routes.auth.signin, request.url));
    }

    if(session && isAuthRoute) {
        return NextResponse.redirect(new URL(routes.home, request.url));
    }
 
    return NextResponse.next();
}
 
export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt$|$|movies/[^/]+$).*)",
    ],
}
