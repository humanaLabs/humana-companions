import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createOrganizationCookie, clearOrganizationCookie } from '@/middleware/tenant';

interface SwitchRequest {
  organizationId: string | null;
}

/**
 * POST /api/organizations/switch
 * Permite Master Admins trocar de contexto organizacional
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Verificar se é Master Admin
    const isMasterAdmin = token.isMasterAdmin === true;
    
    if (!isMasterAdmin) {
      return NextResponse.json(
        { error: 'Only Master Admins can switch organization context' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body: SwitchRequest = await request.json();
    const { organizationId } = body;

    console.log('🔄 Organization switch request:', {
      userId: token.sub,
      fromOrganization: token.organizationId,
      toOrganization: organizationId,
      isMasterAdmin,
    });

    // 4. Validar organização se fornecida
    if (organizationId) {
      // TODO: Adicionar validação se a organização existe no banco
      // Por enquanto, assumir que frontend só envia IDs válidos
      
      if (typeof organizationId !== 'string' || organizationId.length === 0) {
        return NextResponse.json(
          { error: 'Invalid organization ID' },
          { status: 400 }
        );
      }
    }

    // 5. Criar response com cookie atualizado
    const response = NextResponse.json({
      success: true,
      message: organizationId 
        ? `Switched to organization: ${organizationId}`
        : 'Cleared organization context',
      context: {
        userId: token.sub,
        organizationId: organizationId,
        isMasterAdmin: true,
        timestamp: new Date().toISOString(),
      }
    });

    // 6. Definir cookie de organização
    if (organizationId) {
      response.headers.set('Set-Cookie', createOrganizationCookie(organizationId));
    } else {
      response.headers.set('Set-Cookie', clearOrganizationCookie());
    }

    console.log('✅ Organization context switched successfully:', {
      userId: token.sub,
      newOrganizationId: organizationId,
    });

    return response;

  } catch (error) {
    console.error('❌ Error switching organization context:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to switch organization context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations/switch
 * Retorna contexto organizacional atual
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Obter organização ativa do cookie
    const selectedOrgFromCookie = request.cookies.get('selected-organization-id')?.value;
    const userDefaultOrg = token.organizationId as string;
    const isMasterAdmin = token.isMasterAdmin === true;

    let activeOrganizationId: string | null = null;
    
    if (isMasterAdmin) {
      activeOrganizationId = selectedOrgFromCookie || userDefaultOrg || null;
    } else {
      activeOrganizationId = userDefaultOrg;
    }

    return NextResponse.json({
      context: {
        userId: token.sub,
        userEmail: token.email,
        organizationId: activeOrganizationId,
        isMasterAdmin,
        canSwitch: isMasterAdmin,
        source: isMasterAdmin 
          ? (selectedOrgFromCookie ? 'cookie' : 'default') 
          : 'user_default',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error getting organization context:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get organization context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 