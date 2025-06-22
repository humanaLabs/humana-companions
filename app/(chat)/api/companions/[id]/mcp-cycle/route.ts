import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getCompanionById,
  getCompanionFeedback,
  getCompanionInteractions,
  updateCompanion,
  createMCPCycleReport
} from '@/lib/db/queries';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

// POST /api/companions/[id]/mcp-cycle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companionId = params.id;
    
    // 1. Coletar dados do companion
    const companion = await getCompanionById({ id: companionId });
    if (!companion) {
      return NextResponse.json({ error: 'Companion não encontrado' }, { status: 404 });
    }

    // 2. Coletar feedback dos usuários
    const feedback = await getCompanionFeedback(companionId);
    
    // 3. Coletar dados de interações
    const interactions = await getCompanionInteractions(companionId);
    
    // 4. Analisar performance com IA
    const model = myProvider('chat-model');
    
    const analysisPrompt = `
    Analise a performance do Companion "${companion.name}" baseado nos seguintes dados:
    
    DADOS DO COMPANION:
    - Nome: ${companion.name}
    - Função: ${companion.role}
    - Responsabilidades: ${companion.responsibilities.join(', ')}
    - Expertises: ${companion.expertises.map(e => `${e.area}: ${e.topics.join(', ')}`).join('; ')}
    
    FEEDBACK DOS USUÁRIOS (${feedback.length} feedbacks):
    ${feedback.map(f => `
    - Tipo: ${f.type}, Categoria: ${f.category}, Rating: ${f.rating}/5
    - Comentário: ${f.comment}
    `).join('\n')}
    
    MÉTRICAS DE INTERAÇÃO:
    - Total de interações: ${interactions.length}
    - Interações nos últimos 30 dias: ${interactions.filter(i => 
      new Date(i.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length}
    
    Com base nesta análise, forneça:
    1. PONTOS FORTES: Áreas onde o companion está performando bem
    2. PONTOS DE MELHORIA: Áreas que precisam ser aprimoradas
    3. RECOMENDAÇÕES ESPECÍFICAS: Sugestões concretas para melhorar a performance
    4. SCORE GERAL: Nota de 1-10 para a performance geral
    5. PRÓXIMOS PASSOS: Ações prioritárias para o próximo ciclo
    
    Responda em formato JSON estruturado.
    `;

    const { text } = await generateText({
      model,
      prompt: analysisPrompt,
    });

    let analysisResult;
    try {
      analysisResult = JSON.parse(text);
    } catch (e) {
      // Fallback se a IA não retornar JSON válido
      analysisResult = {
        pontos_fortes: ['Análise em processamento'],
        pontos_melhoria: ['Dados insuficientes'],
        recomendacoes: ['Coletar mais feedback'],
        score_geral: 5,
        proximos_passos: ['Continuar monitoramento'],
        raw_analysis: text,
      };
    }

    // 5. Calcular métricas quantitativas
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
      : 0;
    
    const positiveFeedbackRate = feedback.length > 0
      ? (feedback.filter(f => f.type === 'positive').length / feedback.length) * 100
      : 0;

    const interactionTrend = calculateInteractionTrend(interactions);

    // 6. Gerar relatório do ciclo MCP
    const mcpReport = {
      companionId,
      cycleDate: new Date(),
      metrics: {
        averageRating: avgRating,
        totalFeedback: feedback.length,
        positiveFeedbackRate,
        totalInteractions: interactions.length,
        interactionTrend,
        overallScore: analysisResult.score_geral || 5,
      },
      analysis: analysisResult,
      recommendations: analysisResult.recomendacoes || [],
      nextSteps: analysisResult.proximos_passos || [],
      status: 'completed',
    };

    // 7. Salvar relatório
    const savedReport = await createMCPCycleReport(mcpReport);

    // 8. Aplicar melhorias automáticas se necessário
    if (analysisResult.score_geral < 6) {
      // Sugerir atualizações no companion baseadas nas recomendações
      const improvementSuggestions = await generateImprovementSuggestions(
        companion,
        analysisResult
      );
      
      mcpReport.improvementSuggestions = improvementSuggestions;
    }

    return NextResponse.json({
      report: mcpReport,
      message: 'Ciclo MCP executado com sucesso',
    });

  } catch (error) {
    console.error('Error executing MCP cycle:', error);
    return NextResponse.json(
      { error: 'Erro ao executar ciclo MCP' },
      { status: 500 }
    );
  }
}

// GET /api/companions/[id]/mcp-cycle - Histórico de ciclos MCP
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companionId = params.id;
    const reports = await getMCPCycleReports(companionId);
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching MCP cycle reports:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Funções auxiliares
function calculateInteractionTrend(interactions: any[]) {
  if (interactions.length < 2) return 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentInteractions = interactions.filter(i => 
    new Date(i.createdAt) > thirtyDaysAgo
  ).length;

  const previousInteractions = interactions.filter(i => {
    const date = new Date(i.createdAt);
    return date > sixtyDaysAgo && date <= thirtyDaysAgo;
  }).length;

  if (previousInteractions === 0) return recentInteractions > 0 ? 100 : 0;
  
  return ((recentInteractions - previousInteractions) / previousInteractions) * 100;
}

async function generateImprovementSuggestions(companion: any, analysis: any) {
  const model = myProvider('chat-model');
  
  const prompt = `
  Baseado na análise de performance do Companion "${companion.name}", 
  gere sugestões específicas de melhoria para os seguintes campos:
  
  ANÁLISE ATUAL:
  ${JSON.stringify(analysis, null, 2)}
  
  COMPANION ATUAL:
  - Responsabilidades: ${companion.responsibilities.join(', ')}
  - Expertises: ${companion.expertises.map(e => `${e.area}: ${e.topics.join(', ')}`).join('; ')}
  - Regras: ${companion.rules.map(r => `${r.type}: ${r.description}`).join('; ')}
  
  Forneça sugestões para:
  1. Novas responsabilidades a adicionar
  2. Expertises a desenvolver ou aprimorar
  3. Regras a ajustar ou adicionar
  4. Fontes de conhecimento a incluir
  
  Responda em formato JSON estruturado.
  `;

  try {
    const { text } = await generateText({
      model,
      prompt,
    });

    return JSON.parse(text);
  } catch (error) {
    return {
      novas_responsabilidades: [],
      expertises_desenvolver: [],
      regras_ajustar: [],
      fontes_conhecimento: [],
    };
  }
} 