import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createOrganizationApiAdapter } from '@/lib/services/adapters/organization-api-adapter';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from user session or tenant middleware
    const organizationId = session.user.organizationId || 'default-org';
    
    // Create adapter with service layer
    const adapter = await createOrganizationApiAdapter(organizationId);
    
    // Get organizations for user
    const result = await adapter.getUserOrganizations(session.user.id);
    
    if (!result.success) {
      console.error('Failed to fetch organizations:', result.error);
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch organizations' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      organizations: result.data,
      success: true 
    });
  } catch (error) {
    console.error('Organizations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
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

    // Get organization ID from user session or tenant middleware
    const organizationId = session.user.organizationId || 'default-org';
    
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

    // Get tenant organization ID
    const tenantOrganizationId = session.user.organizationId || 'default-org';
    
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

    // Get tenant organization ID
    const tenantOrganizationId = session.user.organizationId || 'default-org';
    
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