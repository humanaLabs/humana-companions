import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CompanionDomainServiceImpl } from '../lib/services/domain/companion-domain-service';
import { CompanionRepositoryImpl } from '../lib/services/repositories/companion-repository';
import type { CreateCompanionRequest, Companion } from '../lib/services/domain/companion-domain-service';

/**
 * 🧪 COMPANION INTEGRATION TESTS
 * Tests the complete companion workflow with complex schema support
 */

describe('Companion Integration Tests', () => {
  let companionService: CompanionDomainServiceImpl;
  let companionRepo: CompanionRepositoryImpl;
  const TEST_ORG_ID = 'test-org-123';
  const DIFFERENT_ORG_ID = 'different-org-456';

  beforeEach(() => {
    companionRepo = new CompanionRepositoryImpl();
    const mockQuotaService = {
      checkQuota: vi.fn().mockResolvedValue(true),
      incrementUsage: vi.fn().mockResolvedValue(undefined)
    };
    
    companionService = new CompanionDomainServiceImpl(
      TEST_ORG_ID,
      companionRepo,
      mockQuotaService
    );
  });

  describe('🎯 Complex Schema Creation', () => {
    test('should create companion with full complex schema', async () => {
      const complexRequest: CreateCompanionRequest = {
        name: 'Chief AI Strategist',
        role: 'AI Strategy Leader and Innovation Driver',
        responsibilities: [
          'Liderar a definição e execução da estratégia de IA',
          'Identificar e priorizar oportunidades de aplicação de IA',
          'Supervisionar a pesquisa e avaliação de tecnologias emergentes'
        ],
        expertises: [
          {
            area: 'Estratégia de Inteligência Artificial',
            topics: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision']
          },
          {
            area: 'Transformação Digital',
            topics: ['Automação de Processos', 'Otimização', 'Inovação Tecnológica']
          }
        ],
        sources: [
          {
            type: 'Knowledge Base',
            description: 'Base de conhecimento sobre estratégias de IA e melhores práticas do mercado'
          },
          {
            type: 'Research Database',
            description: 'Banco de dados com pesquisas acadêmicas e estudos de caso'
          }
        ],
        rules: [
          {
            type: 'tone',
            description: 'Mantenha um tom estratégico e visionário, mas sempre prático e acionável'
          },
          {
            type: 'restriction',
            description: 'Não compartilhe informações sobre tecnologias proprietárias confidenciais'
          },
          {
            type: 'clarification_prompt',
            description: 'Se a pergunta for ambígua, solicite contexto específico da organização e objetivos'
          }
        ],
        contentPolicy: {
          allowed: [
            'Estratégias de implementação de IA',
            'Análise de ROI e viabilidade',
            'Roadmaps tecnológicos',
            'Governança de IA'
          ],
          disallowed: [
            'Informações confidenciais de concorrentes',
            'Dados proprietários sensíveis',
            'Detalhes de implementação interna'
          ]
        },
        skills: [
          {
            name: 'Análise Estratégica de Oportunidades de IA',
            description: 'Capacidade de identificar e avaliar oportunidades de implementação de IA',
            tools: ['Framework de Análise ROI', 'Matriz de Priorização'],
            templates: ['Template de Roadmap de IA', 'Canvas de Estratégia'],
            dados: [
              {
                origem: 'Market Research',
                descricao: 'Dados sobre tendências de mercado e adoção de IA'
              }
            ],
            arquivos: [
              {
                nome: 'ai-strategy-framework.pdf',
                descricao: 'Framework completo para desenvolvimento de estratégia de IA'
              }
            ],
            example: 'Para avaliar implementação de chatbot: analisar volume de tickets, complexidade das consultas, ROI esperado em 12 meses'
          }
        ],
        fallbacks: {
          ambiguous: 'Poderia fornecer mais contexto sobre sua organização, setor e objetivos específicos?',
          out_of_scope: 'Esta questão está fora do meu escopo como estrategista de IA. Posso ajudar com estratégia, implementação e governança.',
          unknown: 'Não tenho informações suficientes sobre este tópico. Poderia reformular ou fornecer mais detalhes?'
        }
      };

      const result = await companionService.createCompanion(complexRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const companion = result.data!;
      expect(companion.name).toBe('Chief AI Strategist');
      expect(companion.organizationId).toBe(TEST_ORG_ID);
      expect(companion.responsibilities).toHaveLength(3);
      expect(companion.expertises).toHaveLength(2);
      expect(companion.sources).toHaveLength(2);
      expect(companion.rules).toHaveLength(3);
      expect(companion.skills).toHaveLength(1);
      expect(companion.contentPolicy.allowed).toHaveLength(4);
      expect(companion.contentPolicy.disallowed).toHaveLength(3);
      
      // Verify structure integrity
      expect(companion.expertises[0].area).toBe('Estratégia de Inteligência Artificial');
      expect(companion.expertises[0].topics).toContain('Machine Learning');
      expect(companion.skills[0].name).toBe('Análise Estratégica de Oportunidades de IA');
      expect(companion.fallbacks.ambiguous).toContain('contexto');
    });

    test('should handle minimal companion creation', async () => {
      const minimalRequest: CreateCompanionRequest = {
        name: 'Simple Assistant',
        role: 'General Helper',
        responsibilities: ['Ajudar com tarefas gerais']
      };

      const result = await companionService.createCompanion(minimalRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const companion = result.data!;
      expect(companion.name).toBe('Simple Assistant');
      expect(companion.expertises).toEqual([]);
      expect(companion.sources).toEqual([]);
      expect(companion.rules).toEqual([]);
      expect(companion.skills).toEqual([]);
      expect(companion.fallbacks).toEqual({});
      expect(companion.contentPolicy).toEqual({ allowed: [], disallowed: [] });
    });
  });

  describe('🔒 Multi-Tenant Isolation', () => {
    test('should enforce strict tenant isolation', async () => {
      // Create companion in first organization
      const request: CreateCompanionRequest = {
        name: 'Org1 Companion',
        role: 'Assistant',
        responsibilities: ['Help org1']
      };

      const createResult = await companionService.createCompanion(request);
      expect(createResult.success).toBe(true);
      
      const companionId = createResult.data!.id;

      // Try to access from different organization
      const differentOrgService = new CompanionDomainServiceImpl(
        DIFFERENT_ORG_ID,
        companionRepo,
        { checkQuota: async () => true, incrementUsage: async () => {} }
      );

      const accessResult = await differentOrgService.getCompanion(companionId);
      expect(accessResult.success).toBe(false);
      expect(accessResult.error?.message).toContain('Access denied');
    });

    test('should list only organization companions', async () => {
      // Create companions in different organizations
      await companionService.createCompanion({
        name: 'Org1 Companion',
        role: 'Assistant',
        responsibilities: ['Help org1']
      });

      const differentOrgService = new CompanionDomainServiceImpl(
        DIFFERENT_ORG_ID,
        companionRepo,
        { checkQuota: async () => true, incrementUsage: async () => {} }
      );

      await differentOrgService.createCompanion({
        name: 'Org2 Companion',
        role: 'Assistant',
        responsibilities: ['Help org2']
      });

      // List companions for each organization
      const org1Result = await companionService.listCompanions();
      const org2Result = await differentOrgService.listCompanions();

      expect(org1Result.success).toBe(true);
      expect(org2Result.success).toBe(true);

      const org1Companions = org1Result.data!;
      const org2Companions = org2Result.data!;

      // Each organization should only see their own companions
      expect(org1Companions.every(c => c.organizationId === TEST_ORG_ID)).toBe(true);
      expect(org2Companions.every(c => c.organizationId === DIFFERENT_ORG_ID)).toBe(true);
      
      // Should not see each other's companions
      expect(org1Companions.some(c => c.name === 'Org2 Companion')).toBe(false);
      expect(org2Companions.some(c => c.name === 'Org1 Companion')).toBe(false);
    });
  });

  describe('🔍 Search and Filtering', () => {
    beforeEach(async () => {
      // Setup test data
      await companionService.createCompanion({
        name: 'AI Strategy Expert',
        role: 'Strategic Advisor',
        responsibilities: ['AI strategy development'],
        expertises: [{ area: 'Artificial Intelligence', topics: ['Strategy', 'Implementation'] }]
      });

      await companionService.createCompanion({
        name: 'HR Business Partner',
        role: 'Human Resources',
        responsibilities: ['HR support'],
        expertises: [{ area: 'Human Resources', topics: ['Recruitment', 'Performance'] }]
      });
    });

    test('should search companions by name', async () => {
      const result = await companionService.searchCompanions('AI Strategy');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('AI Strategy Expert');
    });

    test('should search companions by role', async () => {
      const result = await companionService.searchCompanions('Human Resources');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('HR Business Partner');
    });

    test('should search companions by expertise topics', async () => {
      const result = await companionService.searchCompanions('Strategy');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('AI Strategy Expert');
    });

    test('should filter companions by status', async () => {
      const result = await companionService.listCompanions({ status: 'active' });
      
      expect(result.success).toBe(true);
      expect(result.data!.every(c => c.status === 'active')).toBe(true);
    });
  });

  describe('✏️ Companion Management', () => {
    let companionId: string;

    beforeEach(async () => {
      const createResult = await companionService.createCompanion({
        name: 'Test Companion',
        role: 'Test Role',
        responsibilities: ['Test responsibility']
      });
      companionId = createResult.data!.id;
    });

    test('should update companion successfully', async () => {
      const updateData = {
        name: 'Updated Companion',
        role: 'Updated Role',
        expertises: [
          { area: 'New Expertise', topics: ['Topic 1', 'Topic 2'] }
        ]
      };

      const result = await companionService.updateCompanion(companionId, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe('Updated Companion');
      expect(result.data!.role).toBe('Updated Role');
      expect(result.data!.expertises).toHaveLength(1);
    });

    test('should delete companion successfully', async () => {
      const deleteResult = await companionService.deleteCompanion(companionId);
      expect(deleteResult.success).toBe(true);

      const getResult = await companionService.getCompanion(companionId);
      expect(getResult.success).toBe(true);
      expect(getResult.data).toBeNull();
    });
  });

  describe('🤖 AI Integration', () => {
    let companionId: string;

    beforeEach(async () => {
      const createResult = await companionService.createCompanion({
        name: 'AI Test Companion',
        role: 'AI Assistant',
        responsibilities: ['Provide AI responses']
      });
      companionId = createResult.data!.id;
    });

    test('should generate mock response', async () => {
      const result = await companionService.generateResponse(
        companionId, 
        'What is artificial intelligence?'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('AI Test Companion');
      expect(result.data).toContain('artificial intelligence');
    });

    test('should handle training request', async () => {
      const result = await companionService.trainCompanion(
        companionId, 
        ['Training data 1', 'Training data 2']
      );
      
      expect(result.success).toBe(true);
    });

    test('should get companion analytics', async () => {
      const result = await companionService.getCompanionAnalytics(companionId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.totalInteractions).toBeDefined();
      expect(result.data!.averageRating).toBeDefined();
      expect(result.data!.popularTopics).toBeDefined();
      expect(result.data!.usageOverTime).toBeDefined();
    });
  });

  describe('🚫 Error Handling', () => {
    test('should handle validation errors', async () => {
      const invalidRequest = {
        name: '',
        role: 'Test Role',
        responsibilities: []
      } as CreateCompanionRequest;

      const result = await companionService.createCompanion(invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Name is required');
    });

    test('should handle missing companion errors', async () => {
      const result = await companionService.getCompanion('non-existent-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    test('should handle quota exceeded errors', async () => {
      const mockQuotaService = {
        checkQuota: vi.fn().mockResolvedValue(false),
        incrementUsage: vi.fn().mockResolvedValue(undefined)
      };

      // Simulate quota check by mocking repository count
      vi.spyOn(companionRepo, 'countByOrganization').mockResolvedValue(100);

      const quotaLimitedService = new CompanionDomainServiceImpl(
        TEST_ORG_ID,
        companionRepo,
        mockQuotaService
      );

      const result = await quotaLimitedService.createCompanion({
        name: 'Test Companion',
        role: 'Test Role',
        responsibilities: ['Test']
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('quota exceeded');
    });
  });

  describe('📊 Repository Integration', () => {
    test('should persist companion data correctly', async () => {
      const request: CreateCompanionRequest = {
        name: 'Persistence Test',
        role: 'Test Role',
        responsibilities: ['Test persistence'],
        expertises: [{ area: 'Testing', topics: ['Persistence'] }]
      };

      // Create
      const createResult = await companionService.createCompanion(request);
      expect(createResult.success).toBe(true);
      
      const companionId = createResult.data!.id;

      // Verify persistence by retrieving
      const getResult = await companionService.getCompanion(companionId);
      expect(getResult.success).toBe(true);
      expect(getResult.data!.name).toBe('Persistence Test');
      expect(getResult.data!.expertises[0].area).toBe('Testing');

      // Verify in list
      const listResult = await companionService.listCompanions();
      expect(listResult.success).toBe(true);
      expect(listResult.data!.some(c => c.id === companionId)).toBe(true);
    });

    test('should count companions correctly', async () => {
      const initialCount = await companionRepo.countByOrganization(TEST_ORG_ID);

      await companionService.createCompanion({
        name: 'Count Test 1',
        role: 'Test',
        responsibilities: ['Test']
      });

      await companionService.createCompanion({
        name: 'Count Test 2',
        role: 'Test',
        responsibilities: ['Test']
      });

      const finalCount = await companionRepo.countByOrganization(TEST_ORG_ID);
      expect(finalCount).toBe(initialCount + 2);
    });
  });
}); 