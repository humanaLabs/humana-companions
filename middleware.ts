import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Skip auto-org creation for API routes to avoid infinite loops
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    // Se estiver tentando acessar login ou register, permitir
    if (['/login', '/register'].includes(pathname)) {
      return NextResponse.next();
    }
    
    // Para outras rotas, redirecionar para login
    return NextResponse.redirect(new URL('/login', request.url));
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
      const checkResponse = await fetch(new URL('/api/organizations/check-auto-create', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.id}`,
        },
        body: JSON.stringify({ 
          userId: token.id, 
          userEmail: token.email 
        }),
      });

      if (checkResponse.ok) {
        const { needsOrganization } = await checkResponse.json();
        
        if (needsOrganization) {
          // Create default organization
          await fetch(new URL('/api/organizations/auto-create', request.url), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.id}`,
            },
            body: JSON.stringify({ 
              userId: token.id, 
              userEmail: token.email 
            }),
          });
        }
      }
    } catch (error) {
      // Fail silently to avoid breaking the user experience
      console.error('Error in auto-organization creation:', error);
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
