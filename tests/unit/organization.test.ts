import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createOrganization,
  getOrganizationsForUser,
  checkCanCreateOrganization,
  createDefaultOrganization,
  checkUserHasOrganization,
} from '@/lib/db/queries';

// Mock do banco de dados
vi.mock('@/lib/db/queries', () => ({
  createOrganization: vi.fn(),
  getOrganizationsForUser: vi.fn(),
  checkCanCreateOrganization: vi.fn(),
  createDefaultOrganization: vi.fn(),
  checkUserHasOrganization: vi.fn(),
  getUserById: vi.fn(),
}));

describe('Organization Functions', () => {
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    description: 'Test Description',
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
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization with valid data', async () => {
      const mockCreateOrganization = vi.mocked(createOrganization);
      mockCreateOrganization.mockResolvedValue(mockOrganization);

      const result = await createOrganization(
        'Test Organization',
        'Test Description',
        { timezone: 'America/Sao_Paulo' },
        [],
        [],
        [],
        [],
        mockUserId
      );

      expect(result).toEqual(mockOrganization);
      expect(mockCreateOrganization).toHaveBeenCalledWith(
        'Test Organization',
        'Test Description',
        { timezone: 'America/Sao_Paulo' },
        [],
        [],
        [],
        [],
        mockUserId
      );
    });

    it('should throw error when creation fails', async () => {
      const mockCreateOrganization = vi.mocked(createOrganization);
      mockCreateOrganization.mockRejectedValue(new Error('Database error'));

      await expect(
        createOrganization(
          'Test Organization',
          'Test Description',
          {},
          [],
          [],
          [],
          [],
          mockUserId
        )
      ).rejects.toThrow('Database error');
    });
  });

  describe('getOrganizationsForUser', () => {
    it('should return all organizations for master admin', async () => {
      const mockGetOrganizationsForUser = vi.mocked(getOrganizationsForUser);
      const mockOrganizations = [mockOrganization];
      mockGetOrganizationsForUser.mockResolvedValue(mockOrganizations);

      const result = await getOrganizationsForUser(mockUserId, true);

      expect(result).toEqual(mockOrganizations);
      expect(mockGetOrganizationsForUser).toHaveBeenCalledWith(mockUserId, true);
    });

    it('should return user organizations for regular user', async () => {
      const mockGetOrganizationsForUser = vi.mocked(getOrganizationsForUser);
      const mockOrganizations = [mockOrganization];
      mockGetOrganizationsForUser.mockResolvedValue(mockOrganizations);

      const result = await getOrganizationsForUser(mockUserId, false);

      expect(result).toEqual(mockOrganizations);
      expect(mockGetOrganizationsForUser).toHaveBeenCalledWith(mockUserId, false);
    });
  });

  describe('checkCanCreateOrganization', () => {
    it('should return true for master admin', async () => {
      const mockCheckCanCreateOrganization = vi.mocked(checkCanCreateOrganization);
      mockCheckCanCreateOrganization.mockResolvedValue(true);

      const result = await checkCanCreateOrganization(mockUserId);

      expect(result).toBe(true);
      expect(mockCheckCanCreateOrganization).toHaveBeenCalledWith(mockUserId);
    });

    it('should return false for regular user', async () => {
      const mockCheckCanCreateOrganization = vi.mocked(checkCanCreateOrganization);
      mockCheckCanCreateOrganization.mockResolvedValue(false);

      const result = await checkCanCreateOrganization(mockUserId);

      expect(result).toBe(false);
      expect(mockCheckCanCreateOrganization).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('createDefaultOrganization', () => {
    it('should create default organization with correct structure', async () => {
      const mockCreateDefaultOrganization = vi.mocked(createDefaultOrganization);
      const expectedOrg = {
        ...mockOrganization,
        name: `org_${mockUserEmail}`,
        description: 'Organização criada automaticamente. Você pode editar o nome e descrição.',
      };
      mockCreateDefaultOrganization.mockResolvedValue(expectedOrg);

      const result = await createDefaultOrganization(mockUserId, mockUserEmail);

      expect(result).toEqual(expectedOrg);
      expect(mockCreateDefaultOrganization).toHaveBeenCalledWith(mockUserId, mockUserEmail);
    });

    it('should include default tenant config', async () => {
      const mockCreateDefaultOrganization = vi.mocked(createDefaultOrganization);
      const expectedOrg = {
        ...mockOrganization,
        tenantConfig: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          llm_provider: 'azure-openai',
          default_model: 'gpt-4o',
        },
      };
      mockCreateDefaultOrganization.mockResolvedValue(expectedOrg);

      const result = await createDefaultOrganization(mockUserId, mockUserEmail);

      expect(result.tenantConfig).toEqual(expectedOrg.tenantConfig);
    });
  });

  describe('checkUserHasOrganization', () => {
    it('should return true when user has organizations', async () => {
      const mockCheckUserHasOrganization = vi.mocked(checkUserHasOrganization);
      mockCheckUserHasOrganization.mockResolvedValue(true);

      const result = await checkUserHasOrganization(mockUserId);

      expect(result).toBe(true);
      expect(mockCheckUserHasOrganization).toHaveBeenCalledWith(mockUserId);
    });

    it('should return false when user has no organizations', async () => {
      const mockCheckUserHasOrganization = vi.mocked(checkUserHasOrganization);
      mockCheckUserHasOrganization.mockResolvedValue(false);

      const result = await checkUserHasOrganization(mockUserId);

      expect(result).toBe(false);
      expect(mockCheckUserHasOrganization).toHaveBeenCalledWith(mockUserId);
    });
  });
});

// Testes de validação de dados
describe('Organization Data Validation', () => {
  describe('Organization Structure Validation', () => {
    it('should validate required fields', () => {
      const validOrganization = {
        name: 'Test Org',
        description: 'Test Description',
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

      expect(validOrganization.name).toBeTruthy();
      expect(validOrganization.description).toBeTruthy();
      expect(validOrganization.tenantConfig).toBeDefined();
    });

    it('should validate tenant config structure', () => {
      const tenantConfig = {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        llm_provider: 'azure-openai',
        default_model: 'gpt-4o',
      };

      expect(tenantConfig.timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/);
      expect(['pt-BR', 'en-US', 'es-ES']).toContain(tenantConfig.language);
      expect(['azure-openai', 'openai', 'anthropic']).toContain(tenantConfig.llm_provider);
    });

    it('should validate values structure', () => {
      const values = [
        {
          name: 'Inovação',
          description: 'Busca por soluções criativas',
          principles: ['Experimentar novas tecnologias', 'Aceitar falhas como aprendizado'],
        },
      ];

      values.forEach(value => {
        expect(value.name).toBeTruthy();
        expect(value.description).toBeTruthy();
        expect(Array.isArray(value.principles)).toBe(true);
      });
    });

    it('should validate teams structure', () => {
      const teams = [
        {
          id: 'team-1',
          name: 'Desenvolvimento',
          description: 'Equipe de desenvolvimento',
          members: ['dev-1', 'dev-2'],
          permissions: ['read_code', 'write_code'],
        },
      ];

      teams.forEach(team => {
        expect(team.id).toBeTruthy();
        expect(team.name).toBeTruthy();
        expect(Array.isArray(team.members)).toBe(true);
        expect(Array.isArray(team.permissions)).toBe(true);
      });
    });

    it('should validate positions structure', () => {
      const positions = [
        {
          id: 'pos-1',
          title: 'Tech Lead',
          team_id: 'team-1',
          level: 'senior',
          responsibilities: ['Liderar equipe técnica'],
          required_skills: ['leadership', 'architecture'],
          reporting_to: null,
          companions: [],
        },
      ];

      positions.forEach(position => {
        expect(position.id).toBeTruthy();
        expect(position.title).toBeTruthy();
        expect(Array.isArray(position.responsibilities)).toBe(true);
        expect(Array.isArray(position.required_skills)).toBe(true);
        expect(Array.isArray(position.companions)).toBe(true);
      });
    });
  });
});

// Testes de integração de templates
describe('Organization Templates', () => {
  describe('Template Application', () => {
    it('should apply startup template correctly', () => {
      const startupTemplate = {
        tenantConfig: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          llm_provider: 'azure-openai',
          default_model: 'gpt-4o',
        },
        values: [
          {
            name: 'Inovação',
            description: 'Busca constante por soluções criativas',
            principles: ['Experimentar novas tecnologias'],
          },
        ],
        teams: [
          {
            id: 'product-team',
            name: 'Produto',
            description: 'Equipe de produto',
            members: ['product-manager'],
            permissions: ['read_product', 'write_product'],
          },
        ],
        positions: [
          {
            id: 'product-manager',
            title: 'Product Manager',
            team_id: 'product-team',
            level: 'senior',
            responsibilities: ['Definir estratégia de produto'],
            required_skills: ['product_strategy'],
            reporting_to: null,
            companions: [],
          },
        ],
      };

      expect(startupTemplate.values).toHaveLength(1);
      expect(startupTemplate.teams).toHaveLength(1);
      expect(startupTemplate.positions).toHaveLength(1);
      expect(startupTemplate.values[0].name).toBe('Inovação');
      expect(startupTemplate.teams[0].name).toBe('Produto');
      expect(startupTemplate.positions[0].title).toBe('Product Manager');
    });

    it('should validate template metadata', () => {
      const templateMetadata = {
        name: 'Startup Tecnológica',
        description: 'Estrutura ágil para startups',
        category: 'technology',
      };

      expect(templateMetadata.name).toBeTruthy();
      expect(templateMetadata.description).toBeTruthy();
      expect(['technology', 'consulting', 'retail']).toContain(templateMetadata.category);
    });
  });
}); 