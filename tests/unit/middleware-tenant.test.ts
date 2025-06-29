import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock fetch for organization calls
global.fetch = vi.fn();

describe('Multi-tenant Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🧪 Unit Tests - Middleware Function', () => {
    it('should inject organizationId into request context when valid session exists', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
      } as NextRequest;

      // Import the middleware function (will be created)
      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-organization-id')).toBe('org-456');
      expect(response.headers.get('x-user-id')).toBe('user-123');
    });

    it('should return 401 when session is missing', async () => {
      // Arrange
      vi.mocked(getToken).mockResolvedValue(null);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: 'Authentication required',
        code: 'MISSING_SESSION',
      });
    });

    it('should return 403 when organizationId is missing from session', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        // organizationId missing
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: 'Organization context required',
        code: 'MISSING_ORGANIZATION',
      });
    });

    it('should handle invalid organizationId gracefully', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'invalid-org',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: 'Invalid organization access',
        code: 'INVALID_ORGANIZATION',
      });
    });
  });

  describe('🔗 Integration Tests - NextAuth Session', () => {
    it('should work with full NextAuth session structure', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'regular',
        organizationId: 'org-456',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/companions' },
        url: 'http://localhost:3000/api/companions',
        headers: new Headers({
          'content-type': 'application/json',
          'user-agent': 'test-agent',
        }),
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-organization-id')).toBe('org-456');
      expect(response.headers.get('x-user-id')).toBe('user-123');
      expect(response.headers.get('x-user-type')).toBe('regular');
    });

    it('should handle guest users appropriately', async () => {
      // Arrange
      const mockToken = {
        id: 'guest-123',
        email: 'guest-1234567890@example.com',
        type: 'guest',
        organizationId: 'guest-org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-organization-id')).toBe('guest-org-456');
      expect(response.headers.get('x-user-type')).toBe('guest');
    });
  });

  describe('🔒 Security Tests - Cross-tenant Prevention', () => {
    it('should reject attempts to access different organization data', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/organizations/org-999/data' },
        url: 'http://localhost:3000/api/organizations/org-999/data',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: 'Access denied: Organization mismatch',
        code: 'ORGANIZATION_MISMATCH',
      });
    });

    it('should allow access to own organization data', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/organizations/org-456/companions' },
        url: 'http://localhost:3000/api/organizations/org-456/companions',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-organization-id')).toBe('org-456');
    });

    it('should prevent malicious header injection', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
        headers: new Headers({
          'x-organization-id': 'malicious-org-999', // Attempt to override
          'x-user-id': 'malicious-user-999',
        }),
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      // Should override malicious headers with correct ones
      expect(response.headers.get('x-organization-id')).toBe('org-456');
      expect(response.headers.get('x-user-id')).toBe('user-123');
    });
  });

  describe('⚡ Performance Tests', () => {
    it('should complete middleware processing in under 50ms', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const startTime = performance.now();
      await tenantMiddleware(mockRequest);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;

      // Assert
      expect(executionTime).toBeLessThan(50); // 50ms limit
    });

    it('should not cause memory leaks with multiple requests', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const requests = Array.from({ length: 100 }, (_, i) => ({
        nextUrl: { pathname: `/api/chat/${i}` },
        url: `http://localhost:3000/api/chat/${i}`,
      } as NextRequest));

      const promises = requests.map(req => tenantMiddleware(req));
      const responses = await Promise.all(promises);

      // Assert
      expect(responses).toHaveLength(100);
      responses.forEach(response => {
        expect(response).toBeInstanceOf(NextResponse);
        expect(response.headers.get('x-organization-id')).toBe('org-456');
      });
    });
  });

  describe('🔄 E2E Tests - Full Request Flow', () => {
    it('should handle complete API request with tenant context', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'regular',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/companions' },
        url: 'http://localhost:3000/api/companions',
        method: 'GET',
        headers: new Headers({
          'content-type': 'application/json',
          'authorization': 'Bearer some-token',
        }),
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-organization-id')).toBe('org-456');
      expect(response.headers.get('x-user-id')).toBe('user-123');
      expect(response.headers.get('x-user-type')).toBe('regular');
      
      // Should preserve original request headers
      expect(response.headers.get('content-type')).toBe('application/json');
    });

    it('should work with POST requests containing body', async () => {
      // Arrange
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
      };
      
      vi.mocked(getToken).mockResolvedValue(mockToken);
      
      const mockRequest = {
        nextUrl: { pathname: '/api/chat' },
        url: 'http://localhost:3000/api/chat',
        method: 'POST',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Hello' }),
      } as NextRequest;

      const { tenantMiddleware } = await import('../../middleware/tenant');

      // Act
      const response = await tenantMiddleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-organization-id')).toBe('org-456');
    });
  });
});

// Helper function tests
describe('Tenant Middleware Helpers', () => {
  describe('extractOrganizationFromPath', () => {
    it('should extract organization ID from path parameters', async () => {
      const { extractOrganizationFromPath } = await import('../../middleware/tenant');
      
      expect(extractOrganizationFromPath('/api/organizations/org-123/data')).toBe('org-123');
      expect(extractOrganizationFromPath('/api/chat')).toBeNull();
      expect(extractOrganizationFromPath('/api/organizations/org-456/companions')).toBe('org-456');
    });
  });

  describe('validateOrganizationAccess', () => {
    it('should validate user has access to organization', async () => {
      const { validateOrganizationAccess } = await import('../../middleware/tenant');
      
      expect(validateOrganizationAccess('org-123', 'org-123')).toBe(true);
      expect(validateOrganizationAccess('org-123', 'org-456')).toBe(false);
      expect(validateOrganizationAccess('org-123', null)).toBe(true); // No specific org required
    });
  });
}); 