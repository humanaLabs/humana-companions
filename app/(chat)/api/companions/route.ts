import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createCompanionApiAdapter } from '@/lib/services/adapters/companion-api-adapter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    
    // ✅ Use organization from middleware header (supports switching)
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId || 'default-org';
    
    console.log('🔍 Finding companions for organization:', organizationId);
    
    // Create adapter with service layer
    const adapter = await createCompanionApiAdapter(organizationId);
    
    // Use the adapter's handleListRequest method
    const result = await adapter.handleListRequest(url.searchParams);
    
    if (!result.success) {
      console.error('Failed to fetch companions:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch companions' }, 
        { status: 500 }
      );
    }

    console.log('✅ Found', result.data?.length || 0, 'companions for organization', organizationId);

    return NextResponse.json({ 
      companions: result.data,
      success: true 
    });
  } catch (error) {
    console.error('Companions API error:', error);
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

    // ✅ Use organization from middleware header (supports switching)
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId || 'default-org';
    const userId = session.user.id; // Get userId from session
    
    // Create adapter with service layer
    const adapter = await createCompanionApiAdapter(organizationId);
    
    // Use the adapter's handleCreateRequest method which expects complex schema and userId
    const result = await adapter.handleCreateRequest(request, userId);
    
    if (!result.success) {
      console.error('Failed to create companion:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create companion' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      companion: result.data,
      success: true 
    }, { status: 201 });
  } catch (error) {
    console.error('Companion creation error:', error);
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
    const companionId = url.searchParams.get('id');
    
    if (!companionId) {
      return NextResponse.json({ error: 'Companion ID is required' }, { status: 400 });
    }

    // ✅ Use organization from middleware header (supports switching)
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId || 'default-org';
    
    // Create adapter with service layer
    const adapter = await createCompanionApiAdapter(organizationId);
    
    // Use the adapter's handleUpdateRequest method
    const result = await adapter.handleUpdateRequest(companionId, request);
    
    if (!result.success) {
      console.error('Failed to update companion:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to update companion' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      companion: result.data,
      success: true 
    });
  } catch (error) {
    console.error('Companion update error:', error);
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
    const companionId = url.searchParams.get('id');
    
    if (!companionId) {
      return NextResponse.json({ error: 'Companion ID is required' }, { status: 400 });
    }

    // ✅ Use organization from middleware header (supports switching)
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId || 'default-org';
    
    // Create adapter with service layer
    const adapter = await createCompanionApiAdapter(organizationId);
    
    // Use the adapter's handleDeleteRequest method
    const result = await adapter.handleDeleteRequest(companionId);
    
    if (!result.success) {
      console.error('Failed to delete companion:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to delete companion' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Companion deleted successfully',
      success: true 
    });
  } catch (error) {
    console.error('Companion deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 