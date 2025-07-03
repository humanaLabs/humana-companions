import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { AdminDomainService, type AdminRepository, type AdminUser } from '@/lib/services/domain/admin-domain-service';
import type { ServiceContext } from '@/lib/services/types/service-context';

// Mock Repository Implementation
class MockAdminRepository implements AdminRepository {
  private mockUsers: AdminUser[] = [
    {
      id: '1',
      email: 'admin@humana.com',
      organizationId: '1',
      isMasterAdmin: true,
      status: 'active',
      plan: 'enterprise',
      department: 'TI',
      team: 'Platform',
      role: {
        id: 'master-admin',
        name: 'master_admin',
        displayName: 'Master Admin',
        permissions: ['*']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  async getUsersByOrganization(organizationId: string, filters?: any): Promise<AdminUser[]> {
    return this.mockUsers.filter(u => u.organizationId === organizationId);
  }

  async findUserByEmail(email: string, organizationId: string): Promise<AdminUser | null> {
    return this.mockUsers.find(u => u.email === email && u.organizationId === organizationId) || null;
  }

  async getUserById(userId: string, organizationId: string): Promise<AdminUser | null> {
    return this.mockUsers.find(u => u.id === userId && u.organizationId === organizationId) || null;
  }

  async createUserInvitation(data: any): Promise<AdminUser> {
    const user: AdminUser = {
      id: Math.random().toString(36),
      email: data.email,
      organizationId: data.organizationId,
      status: 'invited',
      plan: 'free',
      isMasterAdmin: false,
      role: { id: 'user', name: 'user', displayName: 'User', permissions: ['chat:read'] },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockUsers.push(user);
    return user;
  }

  async updateUserRole(userId: string, roleId: string, organizationId: string): Promise<AdminUser> {
    const user = this.mockUsers.find(u => u.id === userId && u.organizationId === organizationId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async getRoleById(roleId: string, organizationId: string): Promise<any> {
    return { id: roleId, name: 'user', displayName: 'User', permissions: ['chat:read'] };
  }

  async checkUserPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
    const user = await this.getUserById(userId, organizationId);
    return user?.isMasterAdmin || user?.role.permissions.includes('*') || false;
  }

  async getOrganizationStatistics(organizationId: string): Promise<any> {
    return {
      totalUsers: 1,
      activeUsers: 1,
      invitedUsers: 0,
      totalCompanions: 5,
      totalChats: 150,
      monthlyUsage: { messages: 2500, storage: 104857600 }
    };
  }
}

/**
 * GET /api/admin/users
 * Lista todos os usuários da organização com filtros
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 CRITICAL: Extract organization context
    const organizationId = request.headers.get('x-organization-id') || '1'; // Default fallback
    
    // Build service context
    const serviceContext: ServiceContext = {
      userId: session.user.id!,
      organizationId,
      userType: (session.user as any).type || 'user',
      permissions: (session.user as any).permissions || [],
      isMasterAdmin: (session.user as any).type === 'master'
    };

    // Initialize service layer
    const adminRepository = new MockAdminRepository();
    const adminService = new AdminDomainService(serviceContext, adminRepository);

    // Extract query filters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') as 'active' | 'invited' | 'suspended' || undefined,
      department: searchParams.get('department') || undefined,
      team: searchParams.get('team') || undefined,
      search: searchParams.get('search') || undefined
    };

    // Execute business logic
    const result = await adminService.getOrganizationUsers(filters);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        users: result.data,
        organizationId,
        filters,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Convida novo usuário para a organização
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = request.headers.get('x-organization-id') || '1';
    
    const serviceContext: ServiceContext = {
      userId: session.user.id!,
      organizationId,
      userType: (session.user as any).type || 'user',
      permissions: (session.user as any).permissions || [],
      isMasterAdmin: (session.user as any).type === 'master'
    };

    const body = await request.json();
    const { email, roleId, message } = body;

    if (!email || !roleId) {
      return NextResponse.json(
        { error: 'Email and roleId are required' },
        { status: 400 }
      );
    }

    // Initialize service layer
    const adminRepository = new MockAdminRepository();
    const adminService = new AdminDomainService(serviceContext, adminRepository);

    // Execute business logic
    const result = await adminService.inviteUser({
      email,
      organizationId,
      roleId,
      message
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to invite user' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: result.data,
        message: 'User invited successfully'
      }
    });

  } catch (error) {
    console.error('Admin invite user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 