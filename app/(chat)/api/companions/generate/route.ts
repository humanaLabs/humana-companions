import { auth } from '@/app/(auth)/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

const generateCompanionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().min(1, 'Papel é obrigatório'),
  responsibilities: z.string().min(1, 'Responsabilidades são obrigatórias'),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role, responsibilities } = generateCompanionSchema.parse(body);

    // Processar responsabilidades (dividir por linhas ou vírgulas)
    const responsibilitiesList = responsibilities
      .split(/[\n,]/)
      .map(r => r.trim().replace(/^[-•*]\s*/, ''))
      .filter(r => r.length > 0);

    // Prompt para gerar o Companion completo
    const prompt = `Você é um especialista em design de agentes cognitivos, os Companions da plataforma Humana IA. Quero que você crie um novo Companion a partir de três entradas:

1. Nome do Companion: ${name}
2. Descrição do papel que ele exerce: ${role}  
3. Lista de responsabilidades (R&R):
${responsibilitiesList.map(r => `- ${r}`).join('\n')}

Instruções para o preenchimento:
- Preencha expertises com 2 a 3 áreas que esse papel exigiria, e liste no mínimo 2 tópicos por área.
- Inclua ao menos 1 source principal que represente o conhecimento base do Companion.
- Em rules, defina tom adequado ao papel, 1 ou 2 restrições de conteúdo, e uma pergunta-padrão para dúvidas ambíguas.
- Em content_policy, especifique o que esse Companion pode e não pode responder.
- Em skills, gere 2 habilidades que esse Companion deve dominar, com ferramentas, templates, dados (RAG ou externos) e arquivos esperados.
- Por fim, defina respostas de fallback para perguntas vagas, fora de escopo ou desconhecidas.

IMPORTANTE: Responda APENAS com um JSON válido seguindo exatamente esta estrutura:

{
  "name": "${name}",
  "role": "${role}",
  "responsibilities": [${responsibilitiesList.map(r => `"${r}"`).join(', ')}],
  "expertises": [
    {
      "area": "Nome da área de expertise",
      "topics": ["Tópico 1", "Tópico 2", "Tópico 3"]
    }
  ],
  "sources": [
    {
      "type": "Tipo da fonte",
      "description": "Descrição detalhada da fonte de conhecimento"
    }
  ],
  "rules": [
    {
      "type": "tone",
      "description": "Descrição do tom adequado"
    },
    {
      "type": "restriction",
      "description": "Restrição de conteúdo"
    },
    {
      "type": "clarification_prompt",
      "description": "Pergunta padrão para dúvidas ambíguas"
    }
  ],
  "contentPolicy": {
    "allowed": ["Item permitido 1", "Item permitido 2"],
    "disallowed": ["Item não permitido 1", "Item não permitido 2"]
  },
  "skills": [
    {
      "name": "Nome da habilidade",
      "description": "Descrição da habilidade",
      "tools": ["Ferramenta 1", "Ferramenta 2"],
      "templates": ["Template 1"],
      "dados": [
        {
          "origem": "Fonte dos dados",
          "descricao": "Descrição dos dados"
        }
      ],
      "arquivos": [
        {
          "nome": "Nome do arquivo",
          "descricao": "Descrição do arquivo"
        }
      ],
      "example": "Exemplo prático de uso"
    }
  ],
  "fallbacks": {
    "ambiguous": "Resposta para perguntas ambíguas",
    "out_of_scope": "Resposta para assuntos fora do escopo",
    "unknown": "Resposta para informações desconhecidas"
  }
}

Gere um Companion profissional, detalhado e específico para o papel descrito. Use linguagem em português brasileiro.`;

    // Usar o modelo padrão do sistema
    const model = myProvider.languageModel(DEFAULT_CHAT_MODEL);
    
    const { text: generatedText } = await generateText({
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Tentar extrair JSON da resposta
    let companionData;
    try {
      // Procurar por JSON na resposta
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta da IA');
      }
      
      companionData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Erro ao parsear JSON da IA:', parseError);
      console.error('Resposta da IA:', generatedText);
      throw new Error('Resposta da IA não está em formato JSON válido');
    }

    // Validar estrutura básica
    if (!companionData.name || !companionData.role || !companionData.responsibilities) {
      throw new Error('Estrutura do Companion gerada é inválida');
    }

    return NextResponse.json({ companion: companionData }, { status: 200 });
  } catch (error) {
    console.error('Erro ao gerar companion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao gerar companion' },
      { status: 500 }
    );
  }
} 