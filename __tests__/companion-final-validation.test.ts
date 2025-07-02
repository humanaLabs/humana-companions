import { describe, test, expect } from 'vitest';
import { CompanionDomainServiceImpl } from '../lib/services/domain/companion-domain-service';
import { CompanionRepositoryImpl } from '../lib/services/repositories/companion-repository';

/**
 * 🧪 FINAL VALIDATION TEST
 * Validates that the companion system is working end-to-end
 */

describe('🎯 Final Companion System Validation', () => {
  test('should create companion with complex schema', async () => {
    const TEST_ORG_ID = 'final-test-org';
    
    // Setup components
    const companionRepo = new CompanionRepositoryImpl();
    const quotaService = { 
      checkQuota: async () => true, 
      incrementUsage: async () => {} 
    };
    
    const companionService = new CompanionDomainServiceImpl(
      TEST_ORG_ID,
      companionRepo,
      quotaService
    );

    // The exact companion data that should work
    const companionData = {
      name: 'Chief AI Strategist',
      role: 'AI Strategy Leader',
      responsibilities: [
        'Liderar a definição e execução da estratégia de IA',
        'Identificar oportunidades de inovação com IA',
        'Supervisionar pesquisa e avaliação de tecnologias emergentes'
      ],
      expertises: [
        {
          area: 'Estratégia de IA',
          topics: ['Machine Learning', 'Deep Learning', 'NLP']
        }
      ],
      sources: [
        {
          type: 'Knowledge Base',
          description: 'Base de conhecimento sobre estratégias de IA'
        }
      ],
      rules: [
        {
          type: 'tone' as const,
          description: 'Mantenha um tom estratégico e visionário'
        }
      ],
      contentPolicy: {
        allowed: ['Estratégia de IA', 'Implementação tecnológica'],
        disallowed: ['Informações confidenciais', 'Dados proprietários']
      },
      skills: [
        {
          name: 'Análise Estratégica de IA',
          description: 'Capacidade de avaliar oportunidades de IA',
          tools: ['Framework de Análise', 'Modelos de ROI'],
          templates: ['Template de Roadmap'],
          dados: [
            {
              origem: 'Market Research',
              descricao: 'Dados sobre tendências de IA'
            }
          ],
          arquivos: [
            {
              nome: 'ai-strategy.pdf',
              descricao: 'Framework de estratégia de IA'
            }
          ],
          example: 'Analisar implementação de chatbot: volume, complexidade, ROI'
        }
      ],
      fallbacks: {
        ambiguous: 'Poderia fornecer mais contexto?',
        out_of_scope: 'Fora do meu escopo como estrategista de IA',
        unknown: 'Não tenho informações suficientes'
      }
    };

    // Create companion
    const result = await companionService.createCompanion(companionData);

    // Validate result
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    const companion = result.data!;
    expect(companion.name).toBe('Chief AI Strategist');
    expect(companion.organizationId).toBe(TEST_ORG_ID);
    expect(companion.responsibilities).toHaveLength(3);
    expect(companion.expertises).toHaveLength(1);
    expect(companion.sources).toHaveLength(1);
    expect(companion.rules).toHaveLength(1);
    expect(companion.skills).toHaveLength(1);
    expect(companion.contentPolicy.allowed).toHaveLength(2);
    expect(companion.contentPolicy.disallowed).toHaveLength(2);
    
    console.log('✅ FINAL VALIDATION PASSED! Companion created successfully:', {
      id: companion.id,
      name: companion.name,
      organizationId: companion.organizationId,
      status: companion.status,
      expertisesCount: companion.expertises.length,
      skillsCount: companion.skills.length
    });
  });

  test('should enforce all security measures', async () => {
    const ORG1 = 'security-org-1';
    const ORG2 = 'security-org-2';
    
    const repo = new CompanionRepositoryImpl();
    const quotaService = { checkQuota: async () => true, incrementUsage: async () => {} };
    
    const service1 = new CompanionDomainServiceImpl(ORG1, repo, quotaService);
    const service2 = new CompanionDomainServiceImpl(ORG2, repo, quotaService);

    // Create companion in org1
    const createResult = await service1.createCompanion({
      name: 'Secure Companion',
      role: 'Security Test',
      responsibilities: ['Test security']
    });

    expect(createResult.success).toBe(true);
    const companionId = createResult.data!.id;

    // Verify org1 can access
    const access1 = await service1.getCompanion(companionId);
    expect(access1.success).toBe(true);
    expect(access1.data?.name).toBe('Secure Companion');

    // Verify org2 cannot access
    const access2 = await service2.getCompanion(companionId);
    expect(access2.success).toBe(false);
    expect(access2.error?.message).toContain('Access denied');

    console.log('✅ Security validation passed!');
  });

  test('should validate all required fields', async () => {
    const service = new CompanionDomainServiceImpl(
      'validation-org',
      new CompanionRepositoryImpl(),
      { checkQuota: async () => true, incrementUsage: async () => {} }
    );

    // Test empty name
    const result1 = await service.createCompanion({
      name: '',
      role: 'Test',
      responsibilities: ['Test']
    });
    expect(result1.success).toBe(false);
    expect(result1.error?.message).toContain('Name is required');

    // Test empty role
    const result2 = await service.createCompanion({
      name: 'Test',
      role: '',
      responsibilities: ['Test']
    });
    expect(result2.success).toBe(false);
    expect(result2.error?.message).toContain('Role is required');

    // Test empty responsibilities
    const result3 = await service.createCompanion({
      name: 'Test',
      role: 'Test',
      responsibilities: []
    });
    expect(result3.success).toBe(false);
    expect(result3.error?.message).toContain('At least one responsibility is required');

    console.log('✅ All validation tests passed!');
  });
}); 