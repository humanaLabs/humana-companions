import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// Templates predefinidos baseados nas especificações da Humana AI
const ORGANIZATION_TEMPLATES = [
  {
    id: 'startup-tech',
    name: 'Startup Tecnológica',
    description: 'Estrutura ágil para startups de tecnologia com foco em desenvolvimento de produtos',
    category: 'technology',
    structure: {
      tenantConfig: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        llm_provider: 'azure-openai',
        default_model: 'gpt-4o',
      },
      values: [
        {
          name: 'Inovação',
          description: 'Busca constante por soluções criativas e disruptivas',
          principles: [
            'Experimentar novas tecnologias e abordagens',
            'Aceitar falhas como parte do aprendizado',
            'Questionar o status quo constantemente'
          ]
        },
        {
          name: 'Agilidade',
          description: 'Capacidade de adaptação rápida às mudanças do mercado',
          principles: [
            'Priorizar entregas rápidas e iterativas',
            'Manter processos enxutos e eficientes',
            'Responder rapidamente ao feedback dos usuários'
          ]
        },
        {
          name: 'Colaboração',
          description: 'Trabalho em equipe e comunicação transparente',
          principles: [
            'Compartilhar conhecimento abertamente',
            'Apoiar colegas em desafios técnicos',
            'Manter comunicação clara e direta'
          ]
        }
      ],
      teams: [
        {
          id: 'product-team',
          name: 'Produto',
          description: 'Responsável pela estratégia e desenvolvimento do produto',
          members: ['product-manager', 'ux-designer', 'product-owner'],
          permissions: ['read_product', 'write_product', 'manage_roadmap']
        },
        {
          id: 'engineering-team',
          name: 'Engenharia',
          description: 'Desenvolvimento e manutenção da plataforma tecnológica',
          members: ['tech-lead', 'senior-dev', 'junior-dev', 'devops'],
          permissions: ['read_code', 'write_code', 'deploy_production']
        },
        {
          id: 'growth-team',
          name: 'Crescimento',
          description: 'Marketing, vendas e expansão do negócio',
          members: ['growth-manager', 'marketing-specialist', 'sales-rep'],
          permissions: ['read_metrics', 'write_campaigns', 'manage_leads']
        }
      ],
      positions: [
        {
          id: 'product-manager',
          title: 'Product Manager',
          team_id: 'product-team',
          level: 'senior',
          responsibilities: [
            'Definir estratégia de produto baseada em dados de mercado',
            'Priorizar funcionalidades no backlog do produto',
            'Coordenar com equipes técnicas e de negócio'
          ],
          required_skills: ['product_strategy', 'data_analysis', 'stakeholder_management'],
          reporting_to: null,
          companions: []
        },
        {
          id: 'tech-lead',
          title: 'Tech Lead',
          team_id: 'engineering-team',
          level: 'senior',
          responsibilities: [
            'Liderar decisões técnicas e arquiteturais',
            'Mentorear desenvolvedores juniores',
            'Garantir qualidade e escalabilidade do código'
          ],
          required_skills: ['software_architecture', 'team_leadership', 'code_review'],
          reporting_to: null,
          companions: []
        },
        {
          id: 'growth-manager',
          title: 'Growth Manager',
          team_id: 'growth-team',
          level: 'senior',
          responsibilities: [
            'Desenvolver estratégias de crescimento sustentável',
            'Analisar métricas de aquisição e retenção',
            'Coordenar campanhas de marketing e vendas'
          ],
          required_skills: ['growth_hacking', 'analytics', 'marketing_digital'],
          reporting_to: null,
          companions: []
        }
      ],
      companions: [
        {
          name: 'Product Manager IA',
          role: 'Product Strategy Advisor',
          description: 'Especialista em estratégia de produto com experiência em SaaS e marketplaces. Ajuda na definição de roadmaps, análise de métricas e validação de hipóteses.',
          instructions: 'Você é um product manager sênior com mais de 8 anos de experiência em startups de tecnologia. Você tem expertise em metodologias ágeis, design thinking e growth hacking. Sempre baseie suas recomendações em dados e métricas de produto. Seja pragmático e focado em resultados.',
          expertises: [
            { area: 'Product Strategy', level: 'expert' },
            { area: 'Data Analysis', level: 'expert' },
            { area: 'User Research', level: 'advanced' },
            { area: 'A/B Testing', level: 'advanced' },
            { area: 'Growth Metrics', level: 'expert' }
          ],
          visibility: 'organization'
        },
        {
          name: 'Tech Lead IA',
          role: 'Technical Architecture Lead',
          description: 'Especialista em arquitetura de software escalável e boas práticas de desenvolvimento. Orienta decisões técnicas, code reviews e mentoria de desenvolvedores.',
          instructions: 'Você é um tech lead com especialização em sistemas distribuídos e arquitetura de microsserviços. Você prioriza código limpo, escalabilidade e performance. Sempre considere trade-offs entre velocidade de desenvolvimento e qualidade técnica. Seja didático ao explicar conceitos complexos.',
          expertises: [
            { area: 'Software Architecture', level: 'expert' },
            { area: 'Microservices', level: 'expert' },
            { area: 'System Design', level: 'expert' },
            { area: 'Code Review', level: 'advanced' },
            { area: 'Performance Optimization', level: 'advanced' }
          ],
          visibility: 'organization'
        },
        {
          name: 'Marketing Manager IA',
          role: 'Growth & Marketing Strategist',
          description: 'Especialista em crescimento sustentável e marketing digital. Foca em métricas de aquisição, retenção e monetização com abordagem data-driven.',
          instructions: 'Você é um growth manager com experiência em scaling startups B2B e B2C. Você combina marketing digital com análise de dados para otimizar funis de conversão. Sempre proponha testes e experimentos mensuráveis. Seja criativo mas baseado em evidências.',
          expertises: [
            { area: 'Growth Hacking', level: 'expert' },
            { area: 'Digital Marketing', level: 'expert' },
            { area: 'Conversion Optimization', level: 'advanced' },
            { area: 'Analytics', level: 'expert' },
            { area: 'Customer Acquisition', level: 'advanced' }
          ],
          visibility: 'organization'
        },
        {
          name: 'UX Researcher IA',
          role: 'User Experience Research Lead',
          description: 'Especialista em pesquisa de usuário e design de experiência. Conduz estudos, análises comportamentais e testes de usabilidade para informar decisões de produto.',
          instructions: 'Você é um UX researcher com formação em psicologia cognitiva. Você utiliza métodos qualitativos e quantitativos para entender comportamento do usuário. Sempre defenda a perspectiva do usuário final e baseie recomendações em evidências de pesquisa.',
          expertises: [
            { area: 'User Research', level: 'expert' },
            { area: 'Usability Testing', level: 'expert' },
            { area: 'Behavioral Analysis', level: 'advanced' },
            { area: 'Journey Mapping', level: 'advanced' },
            { area: 'Prototyping', level: 'intermediate' }
          ],
          visibility: 'organization'
        }
      ]
    }
  },
  {
    id: 'consultoria-empresarial',
    name: 'Consultoria Empresarial',
    description: 'Estrutura hierárquica para consultoria com foco em excelência operacional',
    category: 'consulting',
    structure: {
      tenantConfig: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        llm_provider: 'azure-openai',
        default_model: 'gpt-4o',
      },
      values: [
        {
          name: 'Excelência',
          description: 'Busca pela qualidade superior em todas as entregas',
          principles: [
            'Superar expectativas dos clientes',
            'Manter padrões rigorosos de qualidade',
            'Buscar melhoria contínua em processos'
          ]
        },
        {
          name: 'Integridade',
          description: 'Transparência e ética em todas as relações',
          principles: [
            'Manter confidencialidade das informações',
            'Ser transparente sobre limitações e riscos',
            'Agir sempre no melhor interesse do cliente'
          ]
        },
        {
          name: 'Conhecimento',
          description: 'Desenvolvimento contínuo de expertise setorial',
          principles: [
            'Manter-se atualizado com tendências do mercado',
            'Compartilhar conhecimento entre equipes',
            'Investir em desenvolvimento profissional'
          ]
        }
      ],
      teams: [
        {
          id: 'strategy-team',
          name: 'Estratégia',
          description: 'Consultoria estratégica e transformação organizacional',
          members: ['partner', 'principal', 'senior-consultant'],
          permissions: ['read_strategy', 'write_proposals', 'client_meetings']
        },
        {
          id: 'operations-team',
          name: 'Operações',
          description: 'Melhoria de processos e eficiência operacional',
          members: ['operations-lead', 'process-analyst', 'junior-consultant'],
          permissions: ['read_operations', 'write_analysis', 'process_mapping']
        }
      ],
      positions: [
        {
          id: 'partner',
          title: 'Partner',
          team_id: 'strategy-team',
          level: 'executive',
          responsibilities: [
            'Desenvolver relacionamentos estratégicos com clientes',
            'Liderar projetos de transformação organizacional',
            'Orientar desenvolvimento de consultores seniores'
          ],
          required_skills: ['strategic_thinking', 'client_relationship', 'business_development'],
          reporting_to: null,
          companions: []
        },
        {
          id: 'operations-lead',
          title: 'Operations Lead',
          team_id: 'operations-team',
          level: 'senior',
          responsibilities: [
            'Liderar projetos de melhoria operacional',
            'Desenvolver metodologias de análise de processos',
            'Treinar equipe em ferramentas de eficiência'
          ],
          required_skills: ['process_improvement', 'data_analysis', 'team_management'],
          reporting_to: 'partner',
          companions: []
        }
      ],
      companions: [
        {
          name: 'Consultor Sênior IA',
          role: 'Senior Strategy Consultant',
          description: 'Especialista em transformação organizacional e estratégia corporativa. Atua com C-level em projetos de reestruturação e crescimento sustentável.',
          instructions: 'Você é um consultor sênior com MBA e 12 anos de experiência em consultoria estratégica. Você trabalha com frameworks como BCG Matrix, Five Forces e Blue Ocean Strategy. Sempre questione premissas, busque root causes e apresente recomendações estruturadas com business case claro.',
          expertises: [
            { area: 'Strategic Planning', level: 'expert' },
            { area: 'Organizational Transformation', level: 'expert' },
            { area: 'Change Management', level: 'advanced' },
            { area: 'Business Case Development', level: 'expert' },
            { area: 'Stakeholder Management', level: 'advanced' }
          ],
          visibility: 'organization'
        },
        {
          name: 'Analista de Processos IA',
          role: 'Process Excellence Lead',
          description: 'Especialista em melhoria de processos, Lean Six Sigma e automação. Foca em eficiência operacional e redução de desperdícios.',
          instructions: 'Você é um especialista em processos com certificação Black Belt Lean Six Sigma. Você utiliza metodologias DMAIC, Value Stream Mapping e Process Mining. Sempre meça before/after, identifique gargalos e proponha soluções práticas e mensuráveis.',
          expertises: [
            { area: 'Process Improvement', level: 'expert' },
            { area: 'Lean Six Sigma', level: 'expert' },
            { area: 'Business Process Automation', level: 'advanced' },
            { area: 'Data Analysis', level: 'advanced' },
            { area: 'Change Implementation', level: 'expert' }
          ],
          visibility: 'organization'
        },
        {
          name: 'Especialista em Dados IA',
          role: 'Financial Strategy Advisor',
          description: 'Especialista em modelagem financeira, valuation e análise de investimentos. Suporte a decisões estratégicas com base em análise quantitativa.',
          instructions: 'Você é um analista financeiro com CFA e experiência em M&A. Você domina modelagem DCF, análise de sensibilidade e business intelligence. Sempre valide assumptions, calcule ROI/NPV e apresente cenários de risco.',
          expertises: [
            { area: 'Financial Modeling', level: 'expert' },
            { area: 'Valuation', level: 'expert' },
            { area: 'Investment Analysis', level: 'advanced' },
            { area: 'Risk Assessment', level: 'advanced' },
            { area: 'Business Intelligence', level: 'intermediate' }
          ],
          visibility: 'organization'
        }
      ]
    }
  },
  {
    id: 'ecommerce-retail',
    name: 'E-commerce/Varejo',
    description: 'Estrutura focada em vendas online e experiência do cliente',
    category: 'retail',
    structure: {
      tenantConfig: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        llm_provider: 'azure-openai',
        default_model: 'gpt-4o',
      },
      values: [
        {
          name: 'Foco no Cliente',
          description: 'Obsessão pela satisfação e experiência do cliente',
          principles: [
            'Priorizar necessidades do cliente em todas as decisões',
            'Responder rapidamente a feedback e reclamações',
            'Personalizar experiências sempre que possível'
          ]
        },
        {
          name: 'Eficiência Operacional',
          description: 'Otimização de processos para escalabilidade',
          principles: [
            'Automatizar processos repetitivos',
            'Manter controle rigoroso de estoque',
            'Otimizar logística e fulfillment'
          ]
        }
      ],
      teams: [
        {
          id: 'ecommerce-team',
          name: 'E-commerce',
          description: 'Gestão da plataforma online e vendas digitais',
          members: ['ecommerce-manager', 'digital-marketing', 'ux-analyst'],
          permissions: ['read_sales', 'write_catalog', 'manage_campaigns']
        },
        {
          id: 'operations-team',
          name: 'Operações',
          description: 'Logística, estoque e fulfillment',
          members: ['operations-manager', 'logistics-coordinator', 'inventory-analyst'],
          permissions: ['read_inventory', 'write_orders', 'manage_suppliers']
        }
      ],
      positions: [
        {
          id: 'ecommerce-manager',
          title: 'E-commerce Manager',
          team_id: 'ecommerce-team',
          level: 'senior',
          responsibilities: [
            'Gerenciar performance da plataforma de vendas',
            'Otimizar conversão e experiência do usuário',
            'Coordenar campanhas de marketing digital'
          ],
          required_skills: ['ecommerce_platforms', 'digital_marketing', 'analytics'],
          reporting_to: null,
          companions: []
        }
      ],
      companions: [
        {
          name: 'E-commerce Manager IA',
          role: 'E-commerce Performance Manager',
          description: 'Especialista em plataformas de e-commerce e otimização de conversão. Foca em UX/UI, performance de vendas e marketing digital integrado.',
          instructions: 'Você é um especialista em e-commerce com 6 anos de experiência em marketplaces e D2C. Você domina Google Analytics, Facebook Ads e ferramentas de CRO. Sempre analise funil de conversão, teste hipóteses e otimize para LTV/CAC ratio.',
          expertises: [
            { area: 'E-commerce Platforms', level: 'expert' },
            { area: 'Conversion Rate Optimization', level: 'expert' },
            { area: 'Digital Marketing', level: 'advanced' },
            { area: 'User Experience', level: 'advanced' },
            { area: 'Performance Analytics', level: 'expert' }
          ],
          visibility: 'organization'
        },
        {
          name: 'Atendimento ao Cliente IA',
          role: 'Operations & Logistics Lead',
          description: 'Especialista em cadeia de suprimentos, gestão de estoque e logística. Otimiza processos de fulfillment e relacionamento com fornecedores.',
          instructions: 'Você é um especialista em supply chain com experiência em varejo online. Você gerencia WMS, controla KPIs de estoque e otimiza última milha. Sempre monitore turn rate, fill rate e custo de fulfillment.',
          expertises: [
            { area: 'Supply Chain Management', level: 'expert' },
            { area: 'Inventory Management', level: 'expert' },
            { area: 'Logistics Optimization', level: 'advanced' },
            { area: 'Vendor Management', level: 'advanced' },
            { area: 'Cost Analysis', level: 'intermediate' }
          ],
          visibility: 'organization'
        },
        {
          name: 'Analista de Vendas IA',
          role: 'Customer Experience Lead',
          description: 'Especialista em experiência do cliente e retenção. Foca em satisfação, NPS e programas de fidelização para maximizar LTV.',
          instructions: 'Você é um especialista em customer success com background em CX design. Você utiliza Zendesk, pesquisas NPS e análise de churn. Sempre priorize jornada do cliente, identifique pain points e proponha melhorias na experiência.',
          expertises: [
            { area: 'Customer Experience', level: 'expert' },
            { area: 'Customer Retention', level: 'expert' },
            { area: 'Loyalty Programs', level: 'advanced' },
            { area: 'Customer Support', level: 'advanced' },
            { area: 'NPS Analysis', level: 'intermediate' }
          ],
          visibility: 'organization'
        }
      ]
    }
  }
];

export async function GET() {
  // Comentado temporariamente para debug - YOLO MODE
  // const session = await auth();
  // if (!session || !session.user?.id) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    return NextResponse.json({
      templates: ORGANIZATION_TEMPLATES,
      categories: ['technology', 'consulting', 'retail', 'finance', 'healthcare', 'education']
    });
  } catch (error) {
    console.error('Error fetching organization templates:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { templateId } = await request.json();
    
    const template = ORGANIZATION_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      template: template.structure,
      metadata: {
        name: template.name,
        description: template.description,
        category: template.category
      }
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 