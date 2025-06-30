import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex } from './lib/constants';
import { tenantMiddleware } from './middleware/tenant';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Skip tenant validation for auth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Apply tenant middleware to all API routes (except auth)
  if (pathname.startsWith('/api/')) {
    return await tenantMiddleware(request);
  }

  // Non-API routes - existing logic for auto-organization creation
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    salt:
      process.env.NODE_ENV === 'production'
        ? 'authjs.session-token'
        : 'next-auth.session-token',
  });

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware check:', {
      pathname,
      hasToken: !!token,
      tokenEmail: token?.email,
      isAPI: pathname.startsWith('/api/'),
    });
  }

  if (!token) {
    // Se estiver tentando acessar login ou register, permitir
    if (['/login', '/register'].includes(pathname)) {
      return NextResponse.next();
    }

    // Para outras rotas, redirecionar para login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  // Permitir acesso ao login/register mesmo se logado (para trocar de conta)
  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.next();
  }

  // Auto-create organization for first-time users (except guests)
  if (token && !isGuest && token.id) {
    try {
      // Check if user needs an organization
      const baseUrl = request.nextUrl.origin;
      const checkUrl = new URL('/api/organizations/check-auto-create', baseUrl);

      const checkResponse = await fetch(checkUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.id}`,
          'x-user-id': token.id as string,
          'x-user-email': token.email as string,
        },
        body: JSON.stringify({
          userId: token.id,
          userEmail: token.email,
        }),
      });

      if (checkResponse.ok) {
        const { needsOrganization } = await checkResponse.json();

        if (needsOrganization) {
          // Create default organization
          const createUrl = new URL('/api/organizations/auto-create', baseUrl);

          await fetch(createUrl.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token.id}`,
              'x-user-id': token.id as string,
              'x-user-email': token.email as string,
            },
            body: JSON.stringify({
              userId: token.id,
              userEmail: token.email,
            }),
          });
        }
      }
    } catch (error) {
      // Fail silently to avoid breaking the user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in auto-organization creation:', error);
      } else {
        // In production, just log a warning to avoid noise
        console.warn('Auto-organization creation failed (non-critical)');
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
