import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/(chat)/api/organizations/route';
import { GET as getTemplates, POST as applyTemplate } from '@/app/(chat)/api/organizations/templates/route';
import { POST as checkAutoCreate } from '@/app/(chat)/api/organizations/check-auto-create/route';
import { POST as autoCreate } from '@/app/(chat)/api/organizations/auto-create/route';

// Mock do sistema de autenticação
const mockAuth = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    type: 'regular' as const,
  },
};

vi.mock('@/app/(auth)/auth', () => ({
  auth: vi.fn().mockResolvedValue(mockAuth),
}));

// Mock das queries do banco
vi.mock('@/lib/db/queries', () => ({
  getOrganizationsForUser: vi.fn(),
  getUserById: vi.fn(),
  createOrganization: vi.fn(),
  checkCanCreateOrganization: vi.fn(),
  checkUserHasOrganization: vi.fn(),
  createDefaultOrganization: vi.fn(),
}));

describe('Organizations API Integration Tests', () => {
  describe('GET /api/organizations', () => {
    it('should return organizations for authenticated user', async () => {
      const { getUserById, getOrganizationsForUser } = await import('@/lib/db/queries');
      
      vi.mocked(getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        isMasterAdmin: false,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(getOrganizationsForUser).mockResolvedValue([
        {
          id: 'org-123',
          name: 'Test Organization',
          description: 'Test Description',
          tenantConfig: {},
          values: [],
          teams: [],
          positions: [],
          orgUsers: [],
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { req, res } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Test Organization');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { auth } = await import('@/app/(auth)/auth');
      vi.mocked(auth).mockResolvedValue(null);

      const { req, res } = createMocks({ method: 'GET' });
      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it('should return all organizations for master admin', async () => {
      const { getUserById, getOrganizationsForUser } = await import('@/lib/db/queries');
      
      vi.mocked(getUserById).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        isMasterAdmin: true,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(getOrganizationsForUser).mockResolvedValue([
        {
          id: 'org-123',
          name: 'Test Organization 1',
          description: 'Test Description 1',
          tenantConfig: {},
          values: [],
          teams: [],
          positions: [],
          orgUsers: [],
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'org-456',
          name: 'Test Organization 2',
          description: 'Test Description 2',
          tenantConfig: {},
          values: [],
          teams: [],
          positions: [],
          orgUsers: [],
          userId: 'user-456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { req, res } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(getOrganizationsForUser).toHaveBeenCalledWith('user-123', true);
    });
  });

  describe('POST /api/organizations', () => {
    const validOrganizationData = {
      name: 'New Organization',
      description: 'New Description',
      tenantConfig: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        llm_provider: 'azure-openai',
        default_model: 'gpt-4o',
      },
      values: [],
      teams: [],
      positions: [],
      orgUsers: [],
    };

    it('should create organization for master admin', async () => {
      const { checkCanCreateOrganization, createOrganization } = await import('@/lib/db/queries');
      
      vi.mocked(checkCanCreateOrganization).mockResolvedValue(true);
      vi.mocked(createOrganization).mockResolvedValue({
        id: 'org-new',
        ...validOrganizationData,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: validOrganizationData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Organization');
      expect(createOrganization).toHaveBeenCalled();
    });

    it('should return 403 for regular user', async () => {
      const { checkCanCreateOrganization } = await import('@/lib/db/queries');
      vi.mocked(checkCanCreateOrganization).mockResolvedValue(false);

      const { req, res } = createMocks({
        method: 'POST',
        body: validOrganizationData,
      });

      const response = await POST(req);

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid data', async () => {
      const { checkCanCreateOrganization } = await import('@/lib/db/queries');
      vi.mocked(checkCanCreateOrganization).mockResolvedValue(true);

      const invalidData = {
        name: '', // Nome vazio
        description: 'Description',
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/organizations/templates', () => {
    it('should return available templates', async () => {
      const { req, res } = createMocks({ method: 'GET' });
      const response = await getTemplates(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toBeDefined();
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
    });

    it('should return templates with correct structure', async () => {
      const { req, res } = createMocks({ method: 'GET' });
      const response = await getTemplates(req);
      const data = await response.json();

      const template = data.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('structure');
    });
  });

  describe('POST /api/organizations/templates', () => {
    it('should return specific template by ID', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { templateId: 'startup-tech' },
      });

      const response = await applyTemplate(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.name).toBeDefined();
      expect(data.metadata.description).toBeDefined();
    });

    it('should return 404 for invalid template ID', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { templateId: 'invalid-template' },
      });

      const response = await applyTemplate(req);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/organizations/check-auto-create', () => {
    it('should return true when user needs organization', async () => {
      const { checkUserHasOrganization } = await import('@/lib/db/queries');
      vi.mocked(checkUserHasOrganization).mockResolvedValue(false);

      const { req, res } = createMocks({
        method: 'POST',
        body: { userId: 'user-123' },
      });

      const response = await checkAutoCreate(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsOrganization).toBe(true);
    });

    it('should return false when user already has organization', async () => {
      const { checkUserHasOrganization } = await import('@/lib/db/queries');
      vi.mocked(checkUserHasOrganization).mockResolvedValue(true);

      const { req, res } = createMocks({
        method: 'POST',
        body: { userId: 'user-123' },
      });

      const response = await checkAutoCreate(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsOrganization).toBe(false);
    });
  });

  describe('POST /api/organizations/auto-create', () => {
    it('should create default organization for new user', async () => {
      const { checkUserHasOrganization, createDefaultOrganization } = await import('@/lib/db/queries');
      
      vi.mocked(checkUserHasOrganization).mockResolvedValue(false);
      vi.mocked(createDefaultOrganization).mockResolvedValue({
        id: 'org-auto',
        name: 'org_test@example.com',
        description: 'Organização criada automaticamente. Você pode editar o nome e descrição.',
        tenantConfig: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          llm_provider: 'azure-openai',
          default_model: 'gpt-4o',
        },
        values: [],
        teams: [],
        positions: [],
        orgUsers: [],
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { userId: 'user-123', userEmail: 'test@example.com' },
      });

      const response = await autoCreate(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.created).toBe(true);
      expect(data.organization).toBeDefined();
      expect(data.organization.name).toBe('org_test@example.com');
    });

    it('should not create organization if user already has one', async () => {
      const { checkUserHasOrganization } = await import('@/lib/db/queries');
      vi.mocked(checkUserHasOrganization).mockResolvedValue(true);

      const { req, res } = createMocks({
        method: 'POST',
        body: { userId: 'user-123', userEmail: 'test@example.com' },
      });

      const response = await autoCreate(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.created).toBe(false);
      expect(data.message).toBe('User already has organization');
    });

    it('should return 400 for missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { userId: 'user-123' }, // Missing userEmail
      });

      const response = await autoCreate(req);

      expect(response.status).toBe(400);
    });
  });
});

// Testes de fluxo completo
describe('Organization Flow Integration Tests', () => {
  describe('Complete Organization Creation Flow', () => {
    it('should handle complete template-based organization creation', async () => {
      // 1. Get templates
      const { req: templatesReq } = createMocks({ method: 'GET' });
      const templatesResponse = await getTemplates(templatesReq);
      const templatesData = await templatesResponse.json();

      expect(templatesResponse.status).toBe(200);
      expect(templatesData.templates.length).toBeGreaterThan(0);

      // 2. Apply template
      const { req: templateReq } = createMocks({
        method: 'POST',
        body: { templateId: 'startup-tech' },
      });
      const templateResponse = await applyTemplate(templateReq);
      const templateData = await templateResponse.json();

      expect(templateResponse.status).toBe(200);
      expect(templateData.template).toBeDefined();

      // 3. Create organization with template data
      const { checkCanCreateOrganization, createOrganization } = await import('@/lib/db/queries');
      vi.mocked(checkCanCreateOrganization).mockResolvedValue(true);
      vi.mocked(createOrganization).mockResolvedValue({
        id: 'org-template',
        name: templateData.metadata.name,
        description: templateData.metadata.description,
        tenantConfig: templateData.template.tenantConfig,
        values: templateData.template.values,
        teams: templateData.template.teams,
        positions: templateData.template.positions,
        orgUsers: [],
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const organizationData = {
        name: templateData.metadata.name,
        description: templateData.metadata.description,
        tenantConfig: templateData.template.tenantConfig,
        values: templateData.template.values,
        teams: templateData.template.teams,
        positions: templateData.template.positions,
        orgUsers: [],
      };

      const { req: createReq } = createMocks({
        method: 'POST',
        body: organizationData,
      });

      const createResponse = await POST(createReq);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createData.name).toBe(templateData.metadata.name);
      expect(createData.values).toEqual(templateData.template.values);
    });

    it('should handle auto-creation flow for new users', async () => {
      const { checkUserHasOrganization, createDefaultOrganization } = await import('@/lib/db/queries');
      
      // 1. Check if user needs organization
      vi.mocked(checkUserHasOrganization).mockResolvedValue(false);

      const { req: checkReq } = createMocks({
        method: 'POST',
        body: { userId: 'new-user-123' },
      });

      const checkResponse = await checkAutoCreate(checkReq);
      const checkData = await checkResponse.json();

      expect(checkResponse.status).toBe(200);
      expect(checkData.needsOrganization).toBe(true);

      // 2. Auto-create organization
      vi.mocked(createDefaultOrganization).mockResolvedValue({
        id: 'org-auto-new',
        name: 'org_newuser@example.com',
        description: 'Organização criada automaticamente. Você pode editar o nome e descrição.',
        tenantConfig: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          llm_provider: 'azure-openai',
          default_model: 'gpt-4o',
        },
        values: [],
        teams: [],
        positions: [],
        orgUsers: [{
          user_id: 'new-user-123',
          position_id: 'admin',
          role: 'admin',
          permissions: ['read_org', 'write_org', 'manage_companions', 'manage_users'],
        }],
        userId: 'new-user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { req: autoCreateReq } = createMocks({
        method: 'POST',
        body: { userId: 'new-user-123', userEmail: 'newuser@example.com' },
      });

      const autoCreateResponse = await autoCreate(autoCreateReq);
      const autoCreateData = await autoCreateResponse.json();

      expect(autoCreateResponse.status).toBe(200);
      expect(autoCreateData.created).toBe(true);
      expect(autoCreateData.organization.name).toBe('org_newuser@example.com');
      expect(autoCreateData.organization.orgUsers).toHaveLength(1);
      expect(autoCreateData.organization.orgUsers[0].role).toBe('admin');
    });
  });
}); 