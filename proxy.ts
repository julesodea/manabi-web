import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Redirect old vocab routes to new unified vocab page
  const vocabRedirects: Record<string, string> = {
    '/verbs': 'verbs',
    '/nouns': 'nouns',
    '/adjectives': 'adjectives',
    '/adverbs': 'adverbs',
  };

  // Check if the pathname matches any of the old vocab routes
  for (const [oldPath, type] of Object.entries(vocabRedirects)) {
    if (pathname === oldPath || pathname === `${oldPath}/`) {
      const url = new URL('/vocab', request.url);

      // Set the type parameter
      url.searchParams.set('type', type);

      // Preserve existing query parameters
      searchParams.forEach((value, key) => {
        if (key !== 'type') { // Don't duplicate type if it somehow exists
          url.searchParams.set(key, value);
        }
      });

      // Use 307 temporary redirect (not 301 permanent) since this isn't live yet
      return NextResponse.redirect(url, 307);
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
