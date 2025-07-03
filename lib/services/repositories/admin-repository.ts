import { BaseRepository } from './base-repository';
import type { AdminUser } from '../domain/admin-domain-service';

export interface AdminRepository extends BaseRepository<AdminUser> {
  getUsersByOrganization(
    organizationId: string, 
    filters?: {
      status?: 'active' | 'invited' | 'suspended';
      department?: string;
      team?: string;
      search?: string;
    }
  ): Promise<AdminUser[]>;
  
  findUserByEmail(email: string, organizationId: string): Promise<AdminUser | null>;
  getUserById(userId: string, organizationId: string): Promise<AdminUser | null>;
  
  createUserInvitation(data: {
    email: string;
    organizationId: string;
    roleId: string;
    message?: string;
    invitedBy: string;
    status: 'invited';
    expiresAt: Date;
  }): Promise<AdminUser>;
  
  updateUserRole(userId: string, roleId: string, organizationId: string): Promise<AdminUser>;
  
  getRoleById(roleId: string, organizationId: string): Promise<{
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  } | null>;
  
  checkUserPermission(userId: string, organizationId: string, permission: string): Promise<boolean>;
  
  getOrganizationStatistics(organizationId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    invitedUsers: number;
    totalCompanions: number;
    totalChats: number;
    monthlyUsage: {
      messages: number;
      storage: number;
    };
  }>;
}

/**
 * Mock AdminRepository - TEMPORARY for development
 * Replace with real database implementation
 */
export class MockAdminRepository implements AdminRepository {
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

  async create(data: Partial<AdminUser>, organizationId: string): Promise<AdminUser> {
    const user: AdminUser = {
      id: Math.random().toString(36),
      organizationId,
      status: 'active',
      plan: 'free',
      isMasterAdmin: false,
      role: {
        id: 'user',
        name: 'user',
        displayName: 'User',
        permissions: ['chat:read', 'chat:write']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as AdminUser;

    this.mockUsers.push(user);
    return user;
  }

  async findById(id: string, organizationId: string): Promise<AdminUser | null> {
    return this.mockUsers.find(u => u.id === id && u.organizationId === organizationId) || null;
  }

  async findMany(organizationId: string): Promise<AdminUser[]> {
    return this.mockUsers.filter(u => u.organizationId === organizationId);
  }

  async update(id: string, data: Partial<AdminUser>, organizationId: string): Promise<AdminUser> {
    const userIndex = this.mockUsers.findIndex(u => u.id === id && u.organizationId === organizationId);
    if (userIndex === -1) throw new Error('User not found');
    
    this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], ...data, updatedAt: new Date() };
    return this.mockUsers[userIndex];
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const userIndex = this.mockUsers.findIndex(u => u.id === id && u.organizationId === organizationId);
    if (userIndex === -1) return false;
    
    this.mockUsers.splice(userIndex, 1);
    return true;
  }

  async getUsersByOrganization(
    organizationId: string,
    filters?: {
      status?: 'active' | 'invited' | 'suspended';
      department?: string;
      team?: string;
      search?: string;
    }
  ): Promise<AdminUser[]> {
    let users = this.mockUsers.filter(u => u.organizationId === organizationId);

    if (filters?.status) {
      users = users.filter(u => u.status === filters.status);
    }
    if (filters?.department) {
      users = users.filter(u => u.department === filters.department);
    }
    if (filters?.team) {
      users = users.filter(u => u.team === filters.team);
    }
    if (filters?.search) {
      users = users.filter(u => 
        u.email.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    return users;
  }

  async findUserByEmail(email: string, organizationId: string): Promise<AdminUser | null> {
    return this.mockUsers.find(u => u.email === email && u.organizationId === organizationId) || null;
  }

  async getUserById(userId: string, organizationId: string): Promise<AdminUser | null> {
    return this.findById(userId, organizationId);
  }

  async createUserInvitation(data: {
    email: string;
    organizationId: string;
    roleId: string;
    message?: string;
    invitedBy: string;
    status: 'invited';
    expiresAt: Date;
  }): Promise<AdminUser> {
    const role = await this.getRoleById(data.roleId, data.organizationId);
    if (!role) throw new Error('Role not found');

    return this.create({
      email: data.email,
      status: data.status,
      role,
      plan: 'free'
    }, data.organizationId);
  }

  async updateUserRole(userId: string, roleId: string, organizationId: string): Promise<AdminUser> {
    const role = await this.getRoleById(roleId, organizationId);
    if (!role) throw new Error('Role not found');

    return this.update(userId, { role }, organizationId);
  }

  async getRoleById(roleId: string, organizationId: string): Promise<{
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  } | null> {
    const roles = {
      'master-admin': {
        id: 'master-admin',
        name: 'master_admin',
        displayName: 'Master Admin',
        permissions: ['*']
      },
      'admin': {
        id: 'admin',
        name: 'admin',
        displayName: 'Admin',
        permissions: ['admin:users:read', 'admin:users:invite', 'admin:stats:read']
      },
      'user': {
        id: 'user',
        name: 'user',
        displayName: 'User',
        permissions: ['chat:read', 'chat:write']
      }
    };

    return roles[roleId as keyof typeof roles] || null;
  }

  async checkUserPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
    const user = await this.getUserById(userId, organizationId);
    if (!user) return false;

    // Master admin has all permissions
    if (user.isMasterAdmin || user.role.permissions.includes('*')) {
      return true;
    }

    return user.role.permissions.includes(permission);
  }

  async getOrganizationStatistics(organizationId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    invitedUsers: number;
    totalCompanions: number;
    totalChats: number;
    monthlyUsage: {
      messages: number;
      storage: number;
    };
  }> {
    const users = await this.getUsersByOrganization(organizationId);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      invitedUsers: users.filter(u => u.status === 'invited').length,
      totalCompanions: 5, // Mock data
      totalChats: 150,    // Mock data
      monthlyUsage: {
        messages: 2500,
        storage: 1024 * 1024 * 100 // 100MB
      }
    };
  }
} 