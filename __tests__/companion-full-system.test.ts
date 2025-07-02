import { describe, test, expect } from 'vitest';
import { createCompanionApiAdapter } from '../lib/services/adapters/companion-api-adapter';

/**
 * 🧪 FULL SYSTEM INTEGRATION TEST
 * Tests the complete flow that the user experienced in the browser
 */

describe('🎯 Complete Companion Creation Flow', () => {
  test('should handle the exact companion creation from frontend', async () => {
    const TEST_ORG_ID = 'test-org-123';
    
    // Create adapter as it would be done in the API route
    const adapter = await createCompanionApiAdapter(TEST_ORG_ID);

    // Simulate the exact data structure from the AI Companion Generator
    const frontendData = {
      name: 'Chief AI Strategist',
      role: 'Chief AI Strategist é responsável por liderar a definição e execução da estratégia de inteligência artificial da organização, identificando oportunidades de inovação com IA, orientando a integração de tecnologias emergentes e assegurando alinhamento com objetivos de negócio.',
      responsibilities: [
        '- Liderar o desenvolvimento e implementação de uma estratégia abrangente de inteligência artificial alinhada aos objetivos de negócios.',
        '- Identificar e priorizar oportunidades de aplicação de IA para impulsionar a inovação e eficiência operacional.',
        '- Supervisionar a pesquisa e avaliação de tecnologias emergentes de IA para integração estratégica.',
        '- Estabelecer políticas de governança de IA, incluindo ética, conformidade e gestão de riscos.',
        '- Colaborar com líderes executivos para garantir alinhamento estratégico e comunicar o valor das iniciativas de IA.',
        '- Desenvolver e manter parcerias com fornecedores de tecnologia, instituições acadêmicas e startups de IA.'
      ],
      expertises: [
        {
          area: 'Estratégia de Inteligência Artificial',
          topics: ['Machine Learning', 'Deep Learning', 'Processamento de Linguagem Natural', 'Computer Vision']
        },
        {
          area: 'Liderança em Transformação Digital',
          topics: ['Automação de Processos', 'Otimização Operacional', 'Inovação Tecnológica', 'Gestão de Mudanças']
        }
      ],
      sources: [
        {
          type: 'Knowledge Base',
          description: 'Base de conhecimento abrangente sobre estratégias de IA, melhores práticas do setor e tendências emergentes'
        }
      ],
      rules: [
        {
          type: 'tone',
          description: 'Mantenha um tom estratégico e visionário, equilibrando perspectivas técnicas com implicações de negócios'
        },
        {
          type: 'restriction',
          description: 'Não compartilhe informações sobre tecnologias proprietárias confidenciais ou estratégias competitivas sensíveis'
        },
        {
          type: 'clarification_prompt',
          description: 'Se a pergunta for ambígua, solicite esclarecimentos sobre o contexto organizacional, setor e objetivos específicos'
        }
      ],
      contentPolicy: {
        allowed: [
          'Estratégias de implementação de IA',
          'Análises de ROI e viabilidade técnica',
          'Frameworks de governança de IA',
          'Tendências e inovações do mercado'
        ],
        disallowed: [
          'Informações confidenciais sobre concorrentes',
          'Detalhes proprietários de implementações internas',
          'Dados sensíveis de clientes ou parceiros'
        ]
      },
      skills: [
        {
          name: 'Desenvolvimento de Estratégia de IA',
          description: 'Capacidade de criar e implementar estratégias abrangentes de IA alinhadas aos objetivos organizacionais',
          tools: ['Framework de Maturidade de IA', 'Canvas de Estratégia Digital'],
          templates: ['Template de Roadmap de IA', 'Matriz de Priorização de Projetos'],
          dados: [
            {
              origem: 'Pesquisas de Mercado',
              descricao: 'Dados sobre adoção de IA por setor e tendências de investimento'
            }
          ],
          arquivos: [
            {
              nome: 'ai-strategy-playbook.pdf',
              descricao: 'Guia completo para desenvolvimento e implementação de estratégias de IA empresarial'
            }
          ],
          example: 'Para uma empresa de varejo querendo implementar IA: analisaria o histórico de vendas, avaliaria oportunidades em recomendações personalizadas, previsão de demanda e otimização de estoque, definindo roadmap de 18 meses com ROI projetado.'
        }
      ],
      fallbacks: {
        ambiguous: 'Poderia fornecer mais contexto sobre sua organização, setor de atuação e objetivos estratégicos específicos? Isso me permitirá oferecer orientações mais precisas.',
        out_of_scope: 'Esta questão está fora do meu escopo como Chief AI Strategist. Minha especialidade é estratégia, governança e implementação de IA. Posso redirecioná-lo para questões relacionadas?',
        unknown: 'Não tenho informações suficientes sobre este tópico específico. Poderia reformular sua pergunta ou fornecer mais contexto para que eu possa ajudar melhor?'
      }
    };

    // Create the request object as NextRequest would
    const mockRequest = {
      json: async () => frontendData
    } as any;

    // Execute the creation
    const response = await adapter.handleCreateRequest(mockRequest);

    // Verify success
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.message).toBe('Companion created successfully');

    // Verify the companion was created correctly
    const companion = response.data;
    expect(companion.name).toBe('Chief AI Strategist');
    expect(companion.organizationId).toBe(TEST_ORG_ID);
    expect(companion.responsibilities).toHaveLength(6);
    expect(companion.expertises).toHaveLength(2);
    expect(companion.sources).toHaveLength(1);
    expect(companion.rules).toHaveLength(3);
    expect(companion.contentPolicy.allowed).toHaveLength(4);
    expect(companion.contentPolicy.disallowed).toHaveLength(3);
    expect(companion.skills).toHaveLength(1);
    expect(companion.fallbacks.ambiguous).toContain('contexto');

    // Verify the companion can be retrieved
    const getResponse = await adapter.handleGetRequest(companion.id);
    expect(getResponse.success).toBe(true);
    expect(getResponse.data.name).toBe('Chief AI Strategist');

    console.log('✅ Companion created successfully:', {
      id: companion.id,
      name: companion.name,
      organizationId: companion.organizationId,
      expertisesCount: companion.expertises.length,
      skillsCount: companion.skills.length,
      rulesCount: companion.rules.length
    });
  });

  test('should handle companion listing and search', async () => {
    const TEST_ORG_ID = 'test-org-456';
    const adapter = await createCompanionApiAdapter(TEST_ORG_ID);

    // Create multiple companions
    const companion1Data = {
      name: 'HR Business Partner',
      role: 'Human Resources Professional',
      responsibilities: ['Support managers with HR issues', 'Develop retention strategies'],
      expertises: [
        { area: 'Human Resources', topics: ['Recruitment', 'Performance Management'] }
      ]
    };

    const companion2Data = {
      name: 'Marketing Strategist',
      role: 'Marketing Professional',
      responsibilities: ['Develop marketing strategies', 'Analyze market trends'],
      expertises: [
        { area: 'Marketing', topics: ['Digital Marketing', 'Brand Strategy'] }
      ]
    };

    // Create companions
    await adapter.handleCreateRequest({ json: async () => companion1Data } as any);
    await adapter.handleCreateRequest({ json: async () => companion2Data } as any);

    // List all companions
    const listResponse = await adapter.handleListRequest();
    expect(listResponse.success).toBe(true);
    expect(listResponse.data).toHaveLength(2);

    // Search for HR companion
    const searchResponse = await adapter.handleSearchRequest('HR');
    expect(searchResponse.success).toBe(true);
    expect(searchResponse.data).toHaveLength(1);
    expect(searchResponse.data[0].name).toBe('HR Business Partner');

    // Search for Marketing companion
    const marketingResponse = await adapter.handleSearchRequest('Marketing');
    expect(marketingResponse.success).toBe(true);
    expect(marketingResponse.data).toHaveLength(1);
    expect(marketingResponse.data[0].name).toBe('Marketing Strategist');

    console.log('✅ Companion listing and search working correctly');
  });

  test('should validate required fields', async () => {
    const TEST_ORG_ID = 'test-org-validation';
    const adapter = await createCompanionApiAdapter(TEST_ORG_ID);

    // Test missing name
    const invalidData1 = {
      name: '',
      role: 'Test Role',
      responsibilities: ['Test responsibility']
    };

    const response1 = await adapter.handleCreateRequest({ json: async () => invalidData1 } as any);
    expect(response1.success).toBe(false);
    expect(response1.error).toContain('Name is required');

    // Test missing role
    const invalidData2 = {
      name: 'Test Name',
      role: '',
      responsibilities: ['Test responsibility']
    };

    const response2 = await adapter.handleCreateRequest({ json: async () => invalidData2 } as any);
    expect(response2.success).toBe(false);
    expect(response2.error).toContain('Role is required');

    // Test missing responsibilities
    const invalidData3 = {
      name: 'Test Name',
      role: 'Test Role',
      responsibilities: []
    };

    const response3 = await adapter.handleCreateRequest({ json: async () => invalidData3 } as any);
    expect(response3.success).toBe(false);
    expect(response3.error).toContain('At least one responsibility is required');

    console.log('✅ Validation working correctly');
  });

  test('should enforce multi-tenant isolation', async () => {
    const ORG1_ID = 'org-1';
    const ORG2_ID = 'org-2';
    
    const adapter1 = await createCompanionApiAdapter(ORG1_ID);
    const adapter2 = await createCompanionApiAdapter(ORG2_ID);

    // Create companion in org1
    const companionData = {
      name: 'Org1 Companion',
      role: 'Test Role',
      responsibilities: ['Test responsibility']
    };

    const createResponse = await adapter1.handleCreateRequest({ json: async () => companionData } as any);
    expect(createResponse.success).toBe(true);
    
    const companionId = createResponse.data.id;

    // Verify org1 can access its companion
    const org1GetResponse = await adapter1.handleGetRequest(companionId);
    expect(org1GetResponse.success).toBe(true);
    expect(org1GetResponse.data.name).toBe('Org1 Companion');

    // Verify org2 cannot access org1's companion
    const org2GetResponse = await adapter2.handleGetRequest(companionId);
    expect(org2GetResponse.success).toBe(false);
    expect(org2GetResponse.error).toContain('Access denied');

    // Verify org1 sees its companion in list
    const org1ListResponse = await adapter1.handleListRequest();
    expect(org1ListResponse.success).toBe(true);
    expect(org1ListResponse.data.some((c: any) => c.id === companionId)).toBe(true);

    // Verify org2 doesn't see org1's companion in list
    const org2ListResponse = await adapter2.handleListRequest();
    expect(org2ListResponse.success).toBe(true);
    expect(org2ListResponse.data.some((c: any) => c.id === companionId)).toBe(false);

    console.log('✅ Multi-tenant isolation working correctly');
  });
}); 