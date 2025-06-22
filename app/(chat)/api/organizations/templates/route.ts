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
      ]
    }
  }
];

export async function GET() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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