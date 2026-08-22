import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isProtectedRoute =
    path.startsWith("/admin") || path.startsWith("/employee");

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // No authenticated user trying to enter a protected area.
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated but deactivated: block the CRM and send back to login.
  if (user && profile && profile.is_active === false) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "account_inactive");
    return NextResponse.redirect(url);
  }

  // Authenticated user visiting login: route by role only when active.
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = profile?.role === "admin" ? "/admin" : "/employee";
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to enter an area they do not own.
  if (user && isProtectedRoute) {
    if (path.startsWith("/admin") && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/employee";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/login"],
};
