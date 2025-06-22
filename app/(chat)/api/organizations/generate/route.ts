import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createOrganization } from '@/lib/db/queries';
import { generateOrganizationInputSchema } from '../schema';
import { myProvider } from '@/lib/ai/providers';
import { generateText } from 'ai';

const ORGANIZATION_GENERATION_PROMPT = `Você é um especialista em design organizacional e estruturas corporativas. Sua tarefa é criar uma estrutura organizacional completa e profissional baseada nas informações básicas fornecidas pelo usuário.

INSTRUÇÕES IMPORTANTES:
1. Use EXATAMENTE a estrutura JSON fornecida no template
2. Todos os IDs devem seguir o padrão snake_case (ex: "team_product", "pos_ceo")
3. Gere 2-4 valores organizacionais relevantes para o contexto
4. Crie equipes lógicas baseadas na estrutura organizacional fornecida
5. Para cada posição, gere 3-5 responsabilidades específicas e realistas
6. Os companions devem ter nomes no formato "[CARGO].ai" (ex: "CEO.ai", "CPO.ai")
7. Mantenha consistência entre teams, positions e companions
8. Use linguagem profissional em português brasileiro
9. Retorne APENAS o JSON válido, sem explicações adicionais

TEMPLATE DA ESTRUTURA:
{
  "name": "[NOME_DA_ORGANIZACAO]",
  "description": "[DESCRICAO_DETALHADA]",
  "tenantConfig": {
    "timezone": "America/Sao_Paulo",
    "language": "pt-BR",
    "llm_provider": "azure-openai",
    "default_model": "gpt-4o"
  },
  "values": [
    {
      "name": "[NOME_DO_VALOR]",
      "description": "[DESCRICAO_DO_VALOR]",
      "expected_behaviors": [
        "[COMPORTAMENTO_1]",
        "[COMPORTAMENTO_2]"
      ]
    }
  ],
  "teams": [
    {
      "id": "[ID_EQUIPE]",
      "name": "[NOME_EQUIPE]",
      "description": "[DESCRICAO_EQUIPE]",
      "members": []
    }
  ],
  "positions": [
    {
      "id": "[ID_POSICAO]",
      "title": "[TITULO_CARGO]",
      "description": "[DESCRICAO_CARGO]",
      "reports_to": "[ID_CHEFE_OU_NULL]",
      "r_and_r": [
        "[RESPONSABILIDADE_1]",
        "[RESPONSABILIDADE_2]",
        "[RESPONSABILIDADE_3]"
      ],
      "companions": [
        {
          "companion_id": "[ID_COMPANION]",
          "name": "[NOME_COMPANION]",
          "status": "active",
          "linked_team_id": "[ID_EQUIPE]"
        }
      ]
    }
  ],
  "orgUsers": []
}

ENTRADA DO USUÁRIO:
Nome: {name}
Descrição: {description}
Estrutura Organizacional: {orgChart}

Gere uma estrutura organizacional completa e profissional baseada nessas informações:`;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, orgChart } = generateOrganizationInputSchema.parse(body);

    // Gerar a organização usando IA
    const prompt = ORGANIZATION_GENERATION_PROMPT
      .replace('{name}', name)
      .replace('{description}', description)
      .replace('{orgChart}', orgChart);

    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Parse do JSON retornado pela IA
    let organizationData;
    try {
      // Extrair JSON do texto (caso venha com explicações)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      organizationData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI Response:', text);
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA. Tente novamente.' },
        { status: 500 }
      );
    }

    // Validar a estrutura gerada
    if (!organizationData.name || !organizationData.description || 
        !organizationData.tenantConfig || !organizationData.values || 
        !organizationData.teams || !organizationData.positions) {
      console.error('Invalid organization structure from AI:', organizationData);
      return NextResponse.json(
        { error: 'Estrutura de organização inválida gerada pela IA. Tente novamente.' },
        { status: 500 }
      );
    }

    // Criar a organização no banco de dados
    const organization = await createOrganization(
      organizationData.name,
      organizationData.description,
      organizationData.tenantConfig,
      organizationData.values,
      organizationData.teams,
      organizationData.positions,
      organizationData.orgUsers || [],
      session.user.id
    );

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error('Error generating organization:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados de entrada inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 