import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createOrganizationApiAdapter } from '@/lib/services/adapters/organization-api-adapter';
import { db } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🔍 === API ORGANIZATIONS GET STARTED (SIMPLIFIED) ===');
    
    const session = await auth();
    console.log('🔍 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      isMasterAdmin: session?.user?.isMasterAdmin
    });
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking if user is Master Admin...');
    const isMasterAdmin = session.user.isMasterAdmin;
    console.log('👑 User is Master Admin?', isMasterAdmin);

    let organizations = [];

    if (isMasterAdmin) {
      console.log('🔍 Fetching ALL organizations for Master Admin...');
      try {
        organizations = await db.select().from(organization);
        console.log('✅ Master Admin - Organizations found:', organizations.length);
        
        if (organizations.length > 0) {
          console.log('🏢 Organizations list:');
          organizations.forEach((org, index) => {
            console.log(`  ${index + 1}. ${org.name} (ID: ${org.id})`);
          });
        }
      } catch (dbError) {
        console.error('❌ Database error fetching all organizations:', dbError);
        return NextResponse.json({ 
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    } else {
      console.log('🔍 Fetching organizations for regular user...');
      try {
        organizations = await db
          .select()
          .from(organization)
          .where(eq(organization.userId, session.user.id));
        console.log('✅ Regular User - Organizations found:', organizations.length);
      } catch (dbError) {
        console.error('❌ Database error fetching user organizations:', dbError);
        return NextResponse.json({ 
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    console.log('✅ API completed successfully. Returning organizations:', organizations.length);

    return NextResponse.json({ 
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        createdBy: org.userId,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      }))
    });

  } catch (error) {
    console.error('❌ Critical error in organizations API:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, tenantConfig, values, teams, positions } = body;

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // SOLUÇÃO TEMPORÁRIA: Contornar problema do middleware para Master Admins  
    let organizationId = session.user.organizationId;
    
    if (!organizationId) {
      if (session.user.isMasterAdmin) {
        // Master Admin pode usar organização padrão
        organizationId = '00000000-0000-0000-0000-000000000003';
        console.log('🔧 Master Admin POST - usando organização padrão:', organizationId);
      } else {
        console.error('❌ No organizationId found for regular user in POST');
        return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
      }
    }
    
    // Create adapter with service layer
    const adapter = await createOrganizationApiAdapter(organizationId);
    
    // Create organization request
    const createRequest = {
      name,
      description,
      userId: session.user.id,
      tenantConfig,
      values,
      teams,
      positions
    };

    const result = await adapter.createOrganization(createRequest);
    
    if (!result.success) {
      console.error('Failed to create organization:', result.error);
      return NextResponse.json(
        { error: result.error?.message || 'Failed to create organization' }, 
        { status: result.error?.code === 'PERMISSION_DENIED' ? 403 : 500 }
      );
    }

    return NextResponse.json({ 
      organization: result.data,
      success: true 
    }, { status: 201 });
  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('id');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const updates = body;

    // SOLUÇÃO TEMPORÁRIA: Contornar problema do middleware para Master Admins
    let tenantOrganizationId = session.user.organizationId;
    
    if (!tenantOrganizationId) {
      if (session.user.isMasterAdmin) {
        // Master Admin pode usar organização padrão
        tenantOrganizationId = '00000000-0000-0000-0000-000000000003';
        console.log('🔧 Master Admin PUT - usando organização padrão:', tenantOrganizationId);
      } else {
        console.error('❌ No organizationId found for regular user in PUT');
        return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
      }
    }
    
    // Create adapter with service layer
    const adapter = await createOrganizationApiAdapter(tenantOrganizationId);
    
    const result = await adapter.updateOrganization(organizationId, updates, session.user.id);
    
    if (!result.success) {
      console.error('Failed to update organization:', result.error);
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update organization' }, 
        { status: result.error?.code === 'PERMISSION_DENIED' ? 403 : 500 }
      );
    }

    return NextResponse.json({ 
      organization: result.data,
      success: true 
    });
  } catch (error) {
    console.error('Organization update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('id');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // SOLUÇÃO TEMPORÁRIA: Contornar problema do middleware para Master Admins
    let tenantOrganizationId = session.user.organizationId;
    
    if (!tenantOrganizationId) {
      if (session.user.isMasterAdmin) {
        // Master Admin pode usar organização padrão
        tenantOrganizationId = '00000000-0000-0000-0000-000000000003';
        console.log('🔧 Master Admin DELETE - usando organização padrão:', tenantOrganizationId);
      } else {
        console.error('❌ No organizationId found for regular user in DELETE');
        return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
      }
    }
    
    // Create adapter with service layer
    const adapter = await createOrganizationApiAdapter(tenantOrganizationId);
    
    const result = await adapter.deleteOrganization(organizationId, session.user.id);
    
    if (!result.success) {
      console.error('Failed to delete organization:', result.error);
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete organization' }, 
        { status: result.error?.code === 'PERMISSION_DENIED' ? 403 : 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Organization deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 