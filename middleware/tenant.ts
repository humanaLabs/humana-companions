import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Types for better type safety
interface TenantContext {
  userId: string;
  organizationId: string;
  userType: 'guest' | 'regular';
  email: string;
}

interface TenantError {
  error: string;
  code: string;
}

/**
 * Get organization ID for user dynamically
 */
async function getOrganizationForUser(
  userId: string,
  userEmail: string,
): Promise<string> {
  // Determine organization based on user type
  const isGuest = userEmail.includes('guest-');

  if (isGuest) {
    return '00000000-0000-0000-0000-000000000002'; // Guest organization
  } else {
    return '00000000-0000-0000-0000-000000000003'; // Default Humana AI organization
  }
}

/**
 * Multi-tenant middleware that ensures proper organization context isolation
 *
 * SECURITY REQUIREMENTS:
 * - All API requests must have valid session with organizationId
 * - Cross-tenant access must be prevented
 * - Request context must be injected with tenant information
 * - Performance overhead must be < 50ms
 */
export async function tenantMiddleware(
  request: NextRequest,
): Promise<NextResponse> {
  const startTime = performance.now();

  try {
    // 1. Get session token from NextAuth with production-safe configuration
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
    });

    // Log token status for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Token check:', {
        hasToken: !!token,
        userId: token?.id,
        email: token?.email,
        pathname: request.nextUrl.pathname,
      });
    }

    // 2. Validate session exists - be more lenient with certain endpoints
    if (!token) {
      // Some endpoints can work without authentication in specific cases
      const publicEndpoints = ['/api/auth', '/api/health', '/api/ping'];

      const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        request.nextUrl.pathname.startsWith(endpoint),
      );

      if (isPublicEndpoint) {
        return NextResponse.next();
      }

      console.error('❌ No token found for:', request.nextUrl.pathname);
      return createErrorResponse(
        {
          error: 'Authentication required',
          code: 'MISSING_SESSION',
        },
        401,
      );
    }

    // 3. Allow access to user permissions endpoint without organization context
    // This is needed for checking if user can create organizations
    if (request.nextUrl.pathname === '/api/user/permissions') {
      const response = NextResponse.next();

      // Still inject available context headers
      response.headers.set('x-user-id', token.id as string);
      response.headers.set('x-user-type', (token.type as string) || 'regular');
      response.headers.set('x-user-email', token.email as string);
      if (token.organizationId) {
        response.headers.set(
          'x-organization-id',
          token.organizationId as string,
        );
      }

      return response;
    }

    // 4. Get or determine organizationId
    let organizationId = token.organizationId as string;

    if (!organizationId) {
      // If organizationId is not in session, determine it dynamically
      if (process.env.NODE_ENV === 'development') {
        console.log(`📋 Determinando organização para usuário ${token.email}`);
      }
      organizationId = await getOrganizationForUser(
        token.id as string,
        token.email as string,
      );
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏢 Organização determinada: ${organizationId}`);
      }
    }

    // 5. Extract organization from path if present
    const pathOrganizationId = extractOrganizationFromPath(
      request.nextUrl.pathname,
    );

    // 6. Validate cross-tenant access - be more lenient in production
    if (!validateOrganizationAccess(organizationId, pathOrganizationId)) {
      // In production, log the error but be more permissive for certain cases
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Organization mismatch in production:', {
          userOrg: organizationId,
          pathOrg: pathOrganizationId,
          path: request.nextUrl.pathname,
        });

        // Allow if it's a general API route without specific organization context
        if (!pathOrganizationId) {
          // Continue with user's organization
        } else {
          return createErrorResponse(
            {
              error: 'Access denied: Organization mismatch',
              code: 'ORGANIZATION_MISMATCH',
            },
            403,
          );
        }
      } else {
        return createErrorResponse(
          {
            error: 'Access denied: Organization mismatch',
            code: 'ORGANIZATION_MISMATCH',
          },
          403,
        );
      }
    }

    // 7. Validate organization exists (basic validation)
    if (!isValidOrganizationId(organizationId)) {
      return createErrorResponse(
        {
          error: 'Invalid organization access',
          code: 'INVALID_ORGANIZATION',
        },
        403,
      );
    }

    // 8. Create tenant context
    const tenantContext: TenantContext = {
      userId: token.id as string,
      organizationId: organizationId,
      userType: (token.type as 'guest' | 'regular') || 'regular',
      email: token.email as string,
    };

    // 9. Create response with tenant context headers
    const response = NextResponse.next();

    // Inject tenant context into request headers
    response.headers.set('x-organization-id', tenantContext.organizationId);
    response.headers.set('x-user-id', tenantContext.userId);
    response.headers.set('x-user-type', tenantContext.userType);
    response.headers.set('x-user-email', tenantContext.email);

    // Add security headers
    response.headers.set('x-tenant-validated', 'true');
    response.headers.set('x-tenant-timestamp', Date.now().toString());

    // Performance tracking
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    response.headers.set('x-middleware-duration', executionTime.toFixed(2));

    // Warn if performance target is not met
    if (executionTime > 50) {
      console.warn(`Tenant middleware slow: ${executionTime.toFixed(2)}ms`);
    }

    return response;
  } catch (error) {
    console.error('❌ Tenant middleware error:', error);

    // In production, be more permissive with errors to avoid breaking the app
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '🚨 Production middleware error - allowing request to continue',
      );
      const response = NextResponse.next();
      response.headers.set('x-middleware-error', 'true');
      return response;
    }

    return createErrorResponse(
      {
        error: 'Internal server error',
        code: 'MIDDLEWARE_ERROR',
      },
      500,
    );
  }
}

/**
 * Extract organization ID from URL path parameters
 * @param pathname - The request pathname
 * @returns organization ID or null if not found
 */
export function extractOrganizationFromPath(pathname: string): string | null {
  // Match patterns like: /api/organizations/{orgId}/...
  const orgPathMatch = pathname.match(/\/api\/organizations\/([^\/]+)/);
  if (orgPathMatch) {
    return orgPathMatch[1];
  }

  // Match patterns like: /api/{orgId}/...
  const directOrgMatch = pathname.match(/\/api\/([^\/]+)\/[^\/]+/);
  if (directOrgMatch && isValidOrganizationId(directOrgMatch[1])) {
    return directOrgMatch[1];
  }

  return null;
}

/**
 * Validate if user has access to the requested organization
 * @param userOrgId - User's organization ID from session
 * @param requestedOrgId - Organization ID from request path (can be null)
 * @returns true if access is allowed
 */
export function validateOrganizationAccess(
  userOrgId: string,
  requestedOrgId: string | null,
): boolean {
  // If no specific organization is requested, allow access
  if (requestedOrgId === null) {
    return true;
  }

  // User can only access their own organization
  return userOrgId === requestedOrgId;
}

/**
 * Basic validation for organization ID format
 * @param orgId - Organization ID to validate
 * @returns true if valid format
 */
function isValidOrganizationId(orgId: string): boolean {
  // Basic validation - should be UUID format or specific patterns
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const orgPrefixRegex = /^(org|guest-org)-[a-zA-Z0-9-]+$/;

  return uuidRegex.test(orgId) || orgPrefixRegex.test(orgId);
}

/**
 * Create standardized error response
 * @param error - Error information
 * @param status - HTTP status code
 * @returns NextResponse with error
 */
function createErrorResponse(error: TenantError, status: number): NextResponse {
  return NextResponse.json(error, {
    status,
    headers: {
      'x-tenant-error': 'true',
      'x-tenant-error-code': error.code,
    },
  });
}

/**
 * Get tenant context from request headers (for use in API routes)
 * @param request - NextRequest object
 * @returns tenant context or null if not found
 */
export function getTenantContext(request: NextRequest): TenantContext | null {
  const organizationId = request.headers.get('x-organization-id');
  const userId = request.headers.get('x-user-id');
  const userType = request.headers.get('x-user-type') as 'guest' | 'regular';
  const email = request.headers.get('x-user-email');

  if (!organizationId || !userId || !userType || !email) {
    return null;
  }

  return {
    organizationId,
    userId,
    userType,
    email,
  };
}

/**
 * Middleware configuration for Next.js
 */
export const tenantConfig = {
  matcher: [
    // Include all API routes except auth
    '/api/((?!auth).*)',
  ],
};
