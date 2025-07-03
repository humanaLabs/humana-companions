import { describe, expect, test, beforeEach, vi } from 'vitest';
import { AdminDomainService, type AdminUser, type UserInviteRequest } from '@/lib/services/domain/admin-domain-service';
import type { ServiceContext } from '@/lib/services/types/service-context';

// Mock AdminRepository completo
const mockAdminRepository = {
  getUsersByOrganization: vi.fn(),
  findUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUserInvitation: vi.fn(),
  updateUserStatus: vi.fn(),
  deleteUser: vi.fn(),
  getUserStats: vi.fn(),
  getRoleById: vi.fn(),
  checkUserPermission: vi.fn(),
  getOrganizationStatistics: vi.fn(),
  updateUserRole: vi.fn(),
} as any;

describe('AdminDomainService', () => {
  let service: AdminDomainService;
  let context: ServiceContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    context = {
      userId: 'admin-123',
      organizationId: 'org-456',
      userType: 'admin',
      permissions: ['admin:users:read', 'admin:users:write'],
      isMasterAdmin: false,
    };

    service = new AdminDomainService(context, mockAdminRepository);
  });

  describe('🔒 Multi-tenant Isolation', () => {
    test('should enforce organizationId in constructor', () => {
      expect(() => {
        new AdminDomainService(context, mockAdminRepository);
      }).not.toThrow();
      
      expect(service).toBeDefined();
    });

    test('should reject invalid organizationId', () => {
      const invalidContext = { ...context, organizationId: '' };
      
      expect(() => {
        new AdminDomainService(invalidContext, mockAdminRepository);
      }).toThrow('AdminDomainService: organizationId is required');
    });
  });

  describe('👥 User Management', () => {
    test('should handle inviteUser with proper mocks', async () => {
      const request: UserInviteRequest = {
        email: 'newuser@example.com',
        organizationId: 'org-456',
        roleId: 'role-2',
        message: 'Welcome!',
      };

      // Mock sucessful permission check
      mockAdminRepository.checkUserPermission.mockResolvedValue(true);
      mockAdminRepository.findUserByEmail.mockResolvedValue(null);
      mockAdminRepository.getRoleById.mockResolvedValue({
        id: 'role-2',
        name: 'admin',
        displayName: 'Admin',
        permissions: ['read', 'write']
      });
      mockAdminRepository.createUserInvitation.mockResolvedValue({
        id: 'user-new',
        email: request.email,
        organizationId: request.organizationId,
        isMasterAdmin: false,
        status: 'invited',
        plan: 'pro',
        role: {
          id: 'role-2',
          name: 'admin',
          displayName: 'Admin',
          permissions: ['read', 'write']
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.inviteUser(request);

      expect(result.success).toBe(true);
      expect(mockAdminRepository.checkUserPermission).toHaveBeenCalled();
    });

    test('should handle permission validation failure', async () => {
      const request: UserInviteRequest = {
        email: 'test@example.com',
        organizationId: 'org-456',
        roleId: 'role-1',
      };

      // Mock failed permission check
      mockAdminRepository.checkUserPermission.mockResolvedValue(false);

      const result = await service.inviteUser(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ADMIN_OPERATION_FAILED');
    });
  });

  describe('🛡️ Error Handling', () => {
    test('should handle repository errors gracefully', async () => {
      const request: UserInviteRequest = {
        email: 'test@example.com',
        organizationId: 'org-456',
        roleId: 'role-1',
      };

      mockAdminRepository.checkUserPermission.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await service.inviteUser(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ADMIN_OPERATION_FAILED');
    });

    test('should validate required fields', async () => {
      const invalidRequest = {
        email: '', // Invalid
        organizationId: 'org-456',
        roleId: 'role-1',
      } as UserInviteRequest;

      const result = await service.inviteUser(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ADMIN_OPERATION_FAILED');
    });
  });
});

// Integration test
describe('AdminDomainService Integration', () => {
  test('should integrate with service container', () => {
    const context: ServiceContext = {
      userId: 'admin-123',
      organizationId: 'org-456',
      userType: 'admin',
      permissions: ['admin:users:read'],
      isMasterAdmin: false,
    };

    expect(() => {
      new AdminDomainService(context, mockAdminRepository);
    }).not.toThrow();
  });
}); 