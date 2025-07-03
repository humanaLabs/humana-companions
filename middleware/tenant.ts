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

const publicPaths = [
  '/login',
  '/register', 
  '/api/auth',
  '/api/organizations/templates',
];

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
export async function tenantMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // TENTAR MÚLTIPLAS FORMAS DE OBTER O TOKEN
    console.log('🔍 TENTANDO OBTER TOKEN...');
    
    // Método 1: getToken padrão
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET 
    });

    // Método 2: getToken com raw: true
    const tokenRaw = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET,
      raw: true
    });

    console.log('🔍 MÉTODO 1 - TOKEN PADRÃO:', !!token);
    console.log('🔍 MÉTODO 2 - TOKEN RAW:', !!tokenRaw);

    if (!token) {
      console.warn('🚨 No token found in tenant middleware');
      return NextResponse.next();
    }

    // DEBUG EXTREMAMENTE DETALHADO DO TOKEN
    console.log('🔍 TOKEN RAW COMPLETE:', JSON.stringify(token, null, 2));
    console.log('🔍 TOKEN FIELDS MANUAL CHECK:', {
      'token.type': token.type,
      'token.isMasterAdmin': token.isMasterAdmin,
      'token.organizationId': token.organizationId,
      'token["isMasterAdmin"]': token['isMasterAdmin'],
      'token["organizationId"]': token['organizationId'],
      hasOwnPropertyIsMasterAdmin: token.hasOwnProperty('isMasterAdmin'),
      hasOwnPropertyOrganizationId: token.hasOwnProperty('organizationId'),
    });

    const response = NextResponse.next();
    
    // Injetar informações do usuário nos headers
    response.headers.set('x-user-id', token.sub || '');
    response.headers.set('x-user-email', token.email || '');
    response.headers.set('x-user-type', token.type as string || 'regular');
    
    // DEBUG: Log detalhado do token
    console.log('🔍 TOKEN DEBUG:', {
      sub: token.sub,
      email: token.email,
      userType: token.type,           // ✅ CORRIGIDO: token.type ao invés de token.userType
      isMasterAdmin: token.isMasterAdmin,
      organizationId: token.organizationId,
      allTokenKeys: Object.keys(token),
    });
    
    // === CONTEXT SWITCHING ORGANIZACIONAL ===
    
    // 1. Primeiro, tentar obter organizationId do cookie (set pelo frontend)
    const selectedOrgFromCookie = request.cookies.get('selected-organization-id')?.value;
    
    // 2. Fallback: usar organizationId do token (organização padrão do usuário)
    const userDefaultOrg = token.organizationId as string;
    
    // 3. Para Master Admins, permitir switching
    const isMasterAdmin = token.isMasterAdmin === true;
    
    let activeOrganizationId: string | null = null;
    
    if (isMasterAdmin) {
      // Master Admin pode ter qualquer organização ativa
      activeOrganizationId = selectedOrgFromCookie || userDefaultOrg || null;
      
      console.log('🔑 Master Admin context:', {
        selectedFromCookie: selectedOrgFromCookie,
        userDefault: userDefaultOrg,
        active: activeOrganizationId,
      });
    } else {
      // Usuário regular usa sempre sua organização padrão
      activeOrganizationId = userDefaultOrg;
      
      console.log('👤 Regular user context:', {
        organizationId: activeOrganizationId,
      });
    }
    
    // 4. Injetar organizationId ativo nos headers
    if (activeOrganizationId) {
      response.headers.set('x-organization-id', activeOrganizationId);
      
      console.log('🏢 Active organization set:', {
        userId: token.sub,
        organizationId: activeOrganizationId,
        isMasterAdmin,
        path: pathname,
      });
    } else {
      console.warn('⚠️ No active organization found:', {
        userId: token.sub,
        isMasterAdmin,
        path: pathname,
      });
    }
    
    // 5. Para APIs administrativas, validar contexto organizacional
    if (pathname.startsWith('/api/admin/') && !pathname.includes('master')) {
      if (!activeOrganizationId) {
        console.error('🚨 Admin API requires organization context:', pathname);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Organization context required',
            code: 'MISSING_ORGANIZATION_CONTEXT'
          }),
          { 
            status: 400, 
            headers: { 'content-type': 'application/json' } 
          }
        );
      }
    }

    return response;
    
  } catch (error) {
    console.error('❌ Error in tenant middleware:', error);
    return NextResponse.next();
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

/**
 * Helper para criar cookie de organização
 */
export function createOrganizationCookie(organizationId: string) {
  return `selected-organization-id=${organizationId}; Path=/; SameSite=Lax; Max-Age=2592000`; // 30 dias (removido HttpOnly)
}

/**
 * Helper para limpar cookie de organização
 */
export function clearOrganizationCookie() {
  return `selected-organization-id=; Path=/; SameSite=Lax; Max-Age=0`;
}
