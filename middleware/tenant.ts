import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';

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
 * Multi-tenant middleware that ensures proper organization context isolation
 * 
 * SECURITY REQUIREMENTS:
 * - All API requests must have valid session with organizationId
 * - Cross-tenant access must be prevented
 * - Request context must be injected with tenant information
 * - Performance overhead must be < 50ms
 */
export async function tenantMiddleware(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  
  try {
    // 1. Get session token from NextAuth
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    // 2. Validate session exists
    if (!token) {
      return createErrorResponse({
        error: 'Authentication required',
        code: 'MISSING_SESSION',
      }, 401);
    }

    // 3. Validate organizationId exists in session
    if (!token.organizationId) {
      return createErrorResponse({
        error: 'Organization context required',
        code: 'MISSING_ORGANIZATION',
      }, 403);
    }

    // 4. Extract organization from path if present
    const pathOrganizationId = extractOrganizationFromPath(request.nextUrl.pathname);
    
    // 5. Validate cross-tenant access
    if (!validateOrganizationAccess(token.organizationId as string, pathOrganizationId)) {
      return createErrorResponse({
        error: 'Access denied: Organization mismatch',
        code: 'ORGANIZATION_MISMATCH',
      }, 403);
    }

    // 6. Validate organization exists (basic validation)
    if (!isValidOrganizationId(token.organizationId as string)) {
      return createErrorResponse({
        error: 'Invalid organization access',
        code: 'INVALID_ORGANIZATION',
      }, 403);
    }

    // 7. Create tenant context
    const tenantContext: TenantContext = {
      userId: token.id as string,
      organizationId: token.organizationId as string,
      userType: (token.type as 'guest' | 'regular') || 'regular',
      email: token.email as string,
    };

    // 8. Create response with tenant context headers
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
    console.error('Tenant middleware error:', error);
    
    return createErrorResponse({
      error: 'Internal server error',
      code: 'MIDDLEWARE_ERROR',
    }, 500);
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
  requestedOrgId: string | null
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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    }
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