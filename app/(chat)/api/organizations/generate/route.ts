import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createOrganization, createCompanion } from '@/lib/db/queries';
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

// Função para gerar Companion baseado na posição
async function generateCompanionForPosition(
  position: any, 
  organizationName: string, 
  organizationValues: any[]
) {
  const companionPrompt = `Você é um especialista em design de agentes cognitivos corporativos. Crie um Companion AI completo para a posição "${position.title}" na organização "${organizationName}".

INSTRUÇÕES:
1. Use as responsabilidades da posição como base
2. Incorpore os valores organizacionais nos comportamentos
3. Crie expertises relevantes para o cargo
4. Defina sources apropriadas para o contexto corporativo
5. Estabeleça rules de tom e restrições profissionais
6. Configure contentPolicy adequada
7. Retorne APENAS o JSON válido

TEMPLATE:
{
  "role": "Companion Cognitivo [CARGO] da ${organizationName}",
  "responsibilities": [
    "Responsabilidade 1",
    "Responsabilidade 2"
  ],
  "expertises": [
    {
      "area": "Área de Expertise",
      "topics": ["Tópico 1", "Tópico 2"]
    }
  ],
  "sources": [
    {
      "type": "Tipo de Fonte",
      "description": "Descrição da fonte"
    }
  ],
  "rules": [
    {
      "type": "tone",
      "description": "Tom profissional e características"
    },
    {
      "type": "restriction",
      "description": "Restrições e limitações"
    }
  ],
  "contentPolicy": {
    "allowed": ["Conteúdo permitido"],
    "disallowed": ["Conteúdo não permitido"]
  },
  "skills": [
    {
      "name": "Skill Principal",
      "description": "Descrição da habilidade",
      "tools": ["Ferramenta 1"],
      "example": "Exemplo de uso"
    }
  ],
  "fallbacks": {
    "ambiguous": "Resposta para perguntas ambíguas",
    "out_of_scope": "Resposta para fora do escopo",
    "unknown": "Resposta para situações desconhecidas"
  }
}

DADOS DA POSIÇÃO:
Título: ${position.title}
Descrição: ${position.description}
Responsabilidades: ${JSON.stringify(position.r_and_r)}

VALORES ORGANIZACIONAIS:
${JSON.stringify(organizationValues)}

Gere o Companion:`;

  const { text } = await generateText({
    model: myProvider.languageModel('chat-model'),
    prompt: companionPrompt,
    temperature: 0.7,
    maxTokens: 3000,
  });

  // Parse do JSON retornado
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : text;
  return JSON.parse(jsonText);
}

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

    // Criar Companions automaticamente para cada posição
    const createdCompanions = [];
    
    for (const position of organizationData.positions) {
      if (position.companions && position.companions.length > 0) {
        for (const companionData of position.companions) {
          try {
            // Gerar estrutura completa do Companion baseada na posição
            const companionStructure = await generateCompanionForPosition(
              position, 
              organizationData.name,
              organizationData.values
            );

            const [createdCompanion] = await createCompanion({
              name: companionData.name,
              role: companionStructure.role,
              responsibilities: companionStructure.responsibilities,
              expertises: companionStructure.expertises,
              sources: companionStructure.sources,
              rules: companionStructure.rules,
              contentPolicy: companionStructure.contentPolicy,
              skills: companionStructure.skills,
              fallbacks: companionStructure.fallbacks,
              organizationId: organization.id,
              positionId: position.id,
              linkedTeamId: companionData.linked_team_id,
              userId: session.user.id,
            });

            createdCompanions.push({
              ...createdCompanion,
              positionId: position.id,
              linkedTeamId: companionData.linked_team_id,
            });
          } catch (companionError) {
            console.error(`Error creating companion ${companionData.name}:`, companionError);
            // Continua criando outros companions mesmo se um falhar
          }
        }
      }
    }

    return NextResponse.json({
      organization,
      companions: createdCompanions,
      companionsCreated: createdCompanions.length,
    }, { status: 201 });
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