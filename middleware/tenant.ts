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
    // ✅ USAR MESMA CONFIGURAÇÃO DO MIDDLEWARE PRINCIPAL
    console.log('🔍 OBTENDO TOKEN COM CONFIGURAÇÃO COMPLETA...');
    
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
    });

    console.log('🔍 TOKEN OBTIDO:', !!token);

    if (!token) {
      console.warn('🚨 No token found in tenant middleware');
      // SECURITY: Always return 401 for missing authentication
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required', code: 'MISSING_SESSION' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
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
    
    // ✅ EMERGENCY FALLBACK: Se token não tem organizationId, usar padrão
    const EMERGENCY_DEFAULT_ORG = '00000000-0000-0000-0000-000000000003';
    const fallbackOrg = userDefaultOrg || EMERGENCY_DEFAULT_ORG;
    
    // 3. Para Master Admins, permitir switching
    const isMasterAdmin = token.isMasterAdmin === true;
    
    let activeOrganizationId: string | null = null;
    
    if (isMasterAdmin) {
      // Master Admin pode ter qualquer organização ativa
      activeOrganizationId = selectedOrgFromCookie || fallbackOrg;
      
      console.log('🔑 Master Admin context:', {
        selectedFromCookie: selectedOrgFromCookie,
        userDefault: userDefaultOrg,
        fallback: fallbackOrg,
        active: activeOrganizationId,
      });
    } else {
      // Usuário regular usa sempre sua organização padrão ou fallback
      activeOrganizationId = fallbackOrg;
      
      console.log('👤 Regular user context:', {
        organizationId: activeOrganizationId,
        hasUserDefaultOrg: !!userDefaultOrg,
        usingFallback: !userDefaultOrg,
      });
    }
    
    // 4. Validar se organizationId é válido (não vazio, null, undefined, "invalid", etc.)
    if (activeOrganizationId && !isValidOrganizationId(activeOrganizationId)) {
      console.error('🚨 Invalid organizationId detected:', activeOrganizationId);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid organization access', code: 'INVALID_ORGANIZATION' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    // 5. Injetar organizationId ativo nos headers (se disponível)
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
      
      // ✅ CRITICAL ROUTES: Allow access even without organization context
      const allowedWithoutOrg = [
        '/api/organizations',           // Lista organizações do usuário
        '/api/user/permissions',        // Permissões básicas do usuário
        '/api/folders',                 // Folders básicas
        '/api/history',                 // Histórico básico
        '/api/auth/',                   // Rotas de autenticação
        '/api/organizations/switch',    // Troca de organização
        '/api/organizations/auto-create', // Auto-criação
        '/api/organizations/check-auto-create', // Verificar auto-criação
        '/api/chat',                    // Chat básico
        '/api/companions',              // Lista de companions
        '/api/user/',                   // APIs do usuário
        '/api/suggestions',             // Sugestões
        '/api/quotas',                  // Quotas do usuário
      ];
      
      const isAllowedRoute = allowedWithoutOrg.some(route => pathname.startsWith(route));
      
      if (!isAllowedRoute) {
        // SECURITY: Return 403 only for routes that require organization context
        return new NextResponse(
          JSON.stringify({ error: 'Organization context required', code: 'MISSING_ORGANIZATION' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
      
      console.log('✅ Allowing route without organization context:', pathname);
    }
    
    // 6. Validar cross-tenant access prevention
    const pathOrgId = extractOrganizationFromPath(pathname);
    if (pathOrgId && activeOrganizationId && pathOrgId !== activeOrganizationId) {
      // Só Master Admins podem acessar diferentes organizações
      if (!isMasterAdmin) {
        console.error('🚨 Cross-tenant access denied:', {
          userOrg: activeOrganizationId,
          requestedOrg: pathOrgId,
          path: pathname,
        });
        return new NextResponse(
          JSON.stringify({ error: 'Access denied: Organization mismatch', code: 'CROSS_TENANT_DENIED' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // 7. Para APIs administrativas, validar contexto organizacional
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
    // SECURITY: Return 500 instead of continuing on error
    return new NextResponse(
      JSON.stringify({ error: 'Internal middleware error', code: 'MIDDLEWARE_ERROR' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
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
  // ✅ RELAXED VALIDATION: Allow common patterns
  if (!orgId || orgId === 'undefined' || orgId === 'null') {
    return false;
  }
  
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // Organization prefix patterns  
  const orgPrefixRegex = /^(org|guest-org)-[a-zA-Z0-9-]+$/;
  
  // Simple numeric IDs (for testing/development)
  const numericRegex = /^[0-9]+$/;
  
  // Test organization patterns
  const testOrgRegex = /^(test|dev|local)-[a-zA-Z0-9-]+$/;

  return uuidRegex.test(orgId) || 
         orgPrefixRegex.test(orgId) || 
         numericRegex.test(orgId) ||
         testOrgRegex.test(orgId);
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
