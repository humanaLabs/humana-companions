import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { onboardingProgress, userCognitiveProfile } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { OnboardingProgress, UpdateOnboardingProgressRequest } from '@/lib/types';

// Schema de validação para atualização de progresso
const updateOnboardingProgressSchema = z.object({
  currentStep: z.number().int().min(0).optional(),
  completionRate: z.number().min(0).max(100).optional(),
  timeSpent: z.number().int().min(0).optional(),
  strugglingPoints: z.array(z.string()).optional(),
  adaptationEvents: z.array(z.any()).optional(),
  personalizedContent: z.any().optional(),
  featureDiscoveryRate: z.number().min(0).max(100).optional(),
  interactionQuality: z.number().min(0).max(100).optional(),
  confidenceLevel: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
});

// GET /api/learngen/onboarding - Obter progresso de onboarding do usuário
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Buscar progresso de onboarding
    const progress = await db
      .select()
      .from(onboardingProgress)
      .where(
        organizationId 
          ? and(
              eq(onboardingProgress.userId, session.user.id),
              eq(onboardingProgress.organizationId, organizationId)
            )
          : eq(onboardingProgress.userId, session.user.id)
      )
      .limit(1);

    // Buscar perfil cognitivo para personalização
    const cognitiveProfile = await db
      .select()
      .from(userCognitiveProfile)
      .where(
        organizationId 
          ? and(
              eq(userCognitiveProfile.userId, session.user.id),
              eq(userCognitiveProfile.organizationId, organizationId)
            )
          : eq(userCognitiveProfile.userId, session.user.id)
      )
      .limit(1);

    if (progress.length === 0) {
      // Criar onboarding flow personalizado baseado no perfil cognitivo
      const personalizedFlow = generateOnboardingFlow(cognitiveProfile[0] || null);
      
      return NextResponse.json({ 
        progress: null,
        personalizedFlow,
        needsInitialization: true,
        message: 'Onboarding não iniciado. Flow personalizado gerado.'
      });
    }

    const currentProgress = {
      ...progress[0],
      createdAt: progress[0].createdAt,
      updatedAt: progress[0].updatedAt,
    } as OnboardingProgress;

    // Gerar próximos passos adaptativos
    const nextSteps = generateAdaptiveNextSteps(currentProgress, cognitiveProfile[0] || null);

    return NextResponse.json({ 
      progress: currentProgress,
      nextSteps,
      personalizedFlow: generateOnboardingFlow(cognitiveProfile[0] || null),
      needsInitialization: false
    });
  } catch (error) {
    console.error('Erro ao buscar progresso de onboarding:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar progresso de onboarding' },
      { status: 500 }
    );
  }
}

// POST /api/learngen/onboarding - Inicializar onboarding
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationId } = body;

    // Verificar se já existe onboarding em progresso
    const existingProgress = await db
      .select()
      .from(onboardingProgress)
      .where(
        organizationId 
          ? and(
              eq(onboardingProgress.userId, session.user.id),
              eq(onboardingProgress.organizationId, organizationId)
            )
          : eq(onboardingProgress.userId, session.user.id)
      )
      .limit(1);

    if (existingProgress.length > 0) {
      return NextResponse.json({
        progress: existingProgress[0],
        message: 'Onboarding já existe'
      });
    }

    // Buscar perfil cognitivo para personalização
    const cognitiveProfile = await db
      .select()
      .from(userCognitiveProfile)
      .where(
        organizationId 
          ? and(
              eq(userCognitiveProfile.userId, session.user.id),
              eq(userCognitiveProfile.organizationId, organizationId)
            )
          : eq(userCognitiveProfile.userId, session.user.id)
      )
      .limit(1);

    // Determinar número total de passos baseado no perfil
    const totalSteps = determineTotalSteps(cognitiveProfile[0] || null);

    // Criar novo progresso de onboarding
    const [newProgress] = await db
      .insert(onboardingProgress)
      .values({
        userId: session.user.id,
        organizationId: organizationId || null,
        currentStep: 0,
        totalSteps,
        completionRate: 0,
        timeSpent: 0,
        startedAt: new Date(),
        strugglingPoints: [],
        adaptationEvents: [],
        personalizedContent: generateInitialPersonalizedContent(cognitiveProfile[0] || null),
        featureDiscoveryRate: 0,
        interactionQuality: 0,
        confidenceLevel: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const progress = {
      ...newProgress,
      createdAt: newProgress.createdAt,
      updatedAt: newProgress.updatedAt,
    } as OnboardingProgress;

    // Gerar flow personalizado
    const personalizedFlow = generateOnboardingFlow(cognitiveProfile[0] || null);

    return NextResponse.json({ 
      progress,
      personalizedFlow,
      message: 'Onboarding inicializado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao inicializar onboarding:', error);
    return NextResponse.json(
      { error: 'Falha ao inicializar onboarding' },
      { status: 500 }
    );
  }
}

// PUT /api/learngen/onboarding - Atualizar progresso de onboarding
export async function PUT(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationId, ...updateData } = body;
    
    // Validar dados de entrada
    const validatedData = updateOnboardingProgressSchema.parse(updateData);

    // Buscar progresso existente
    const existingProgress = await db
      .select()
      .from(onboardingProgress)
      .where(
        organizationId 
          ? and(
              eq(onboardingProgress.userId, session.user.id),
              eq(onboardingProgress.organizationId, organizationId)
            )
          : eq(onboardingProgress.userId, session.user.id)
      )
      .limit(1);

    if (existingProgress.length === 0) {
      return NextResponse.json(
        { error: 'Progresso de onboarding não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updatePayload: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Se completado, definir completedAt
    if (validatedData.completed || validatedData.completionRate === 100) {
      updatePayload.completedAt = new Date();
      updatePayload.completionRate = 100;
    }

    // Detectar pontos de dificuldade
    if (validatedData.currentStep !== undefined && existingProgress[0].currentStep === validatedData.currentStep) {
      // Usuário pode estar com dificuldades no mesmo passo
      const strugglingThreshold = 300; // 5 minutos em segundos
      const timeOnStep = (validatedData.timeSpent || 0) - existingProgress[0].timeSpent;
      
      if (timeOnStep > strugglingThreshold) {
        const strugglingPoint = `step-${validatedData.currentStep}-time-${timeOnStep}s`;
        updatePayload.strugglingPoints = [...(existingProgress[0].strugglingPoints || []), strugglingPoint];
        
        // Registrar evento de adaptação
        const adaptationEvent = {
          type: 'struggling_detected',
          step: validatedData.currentStep,
          timeSpent: timeOnStep,
          timestamp: new Date().toISOString(),
          adaptationApplied: 'additional_guidance',
        };
        updatePayload.adaptationEvents = [...(existingProgress[0].adaptationEvents || []), adaptationEvent];
      }
    }

    // Atualizar progresso
    const [updatedProgress] = await db
      .update(onboardingProgress)
      .set(updatePayload)
      .where(eq(onboardingProgress.id, existingProgress[0].id))
      .returning();

    const progress = {
      ...updatedProgress,
      createdAt: updatedProgress.createdAt,
      updatedAt: updatedProgress.updatedAt,
    } as OnboardingProgress;

    // Gerar próximos passos adaptativos
    const cognitiveProfile = await db
      .select()
      .from(userCognitiveProfile)
      .where(eq(userCognitiveProfile.userId, session.user.id))
      .limit(1);

    const nextSteps = generateAdaptiveNextSteps(progress, cognitiveProfile[0] || null);

    return NextResponse.json({ 
      progress,
      nextSteps,
      adaptations: updatePayload.adaptationEvents || [],
      message: 'Progresso atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar progresso de onboarding:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha ao atualizar progresso de onboarding' },
      { status: 500 }
    );
  }
}

// Funções auxiliares para personalização

function determineTotalSteps(cognitiveProfile: any): number {
  if (!cognitiveProfile) return 8; // Default
  
  // Ajustar número de passos baseado na experiência
  switch (cognitiveProfile.aiToolsExperience) {
    case 'novice': return 12; // Mais passos para iniciantes
    case 'intermediate': return 8; // Padrão
    case 'advanced': return 6; // Menos passos para experientes
    default: return 8;
  }
}

function generateInitialPersonalizedContent(cognitiveProfile: any) {
  if (!cognitiveProfile) return {};
  
  return {
    welcomeMessage: generateWelcomeMessage(cognitiveProfile),
    preferredInteractions: getPreferredInteractions(cognitiveProfile),
    adaptationSettings: {
      pace: cognitiveProfile.aiToolsExperience === 'novice' ? 'slow' : 'medium',
      detailLevel: cognitiveProfile.primaryCognitiveStyle === 'reading' ? 'high' : 'medium',
      interactionStyle: cognitiveProfile.primaryCognitiveStyle,
    }
  };
}

function generateWelcomeMessage(cognitiveProfile: any): string {
  const experience = cognitiveProfile.aiToolsExperience;
  const style = cognitiveProfile.primaryCognitiveStyle;
  
  if (experience === 'novice') {
    return style === 'visual' 
      ? "Vamos começar com uma introdução visual aos AI Companions!"
      : "Bem-vindo! Vamos aprender juntos sobre AI Companions passo a passo.";
  }
  
  return "Ótimo ter você aqui! Vamos personalizar sua experiência com AI Companions.";
}

function getPreferredInteractions(cognitiveProfile: any): string[] {
  const interactions = ['guided-tour'];
  
  switch (cognitiveProfile.primaryCognitiveStyle) {
    case 'visual':
      interactions.push('interactive-demos', 'visual-tutorials');
      break;
    case 'kinesthetic':
      interactions.push('hands-on-practice', 'interactive-exercises');
      break;
    case 'auditory':
      interactions.push('audio-explanations', 'conversation-practice');
      break;
    case 'reading':
      interactions.push('detailed-guides', 'step-by-step-instructions');
      break;
  }
  
  return interactions;
}

function generateOnboardingFlow(cognitiveProfile: any) {
  const baseSteps = [
    { id: 'welcome', title: 'Bem-vindo', type: 'tutorial' },
    { id: 'profile-setup', title: 'Configurar Perfil', type: 'assessment' },
    { id: 'first-companion', title: 'Seu Primeiro Companion', type: 'practice' },
    { id: 'conversation-basics', title: 'Básicos de Conversação', type: 'tutorial' },
    { id: 'document-upload', title: 'Upload de Documentos', type: 'practice' },
    { id: 'features-overview', title: 'Visão Geral das Features', type: 'tutorial' },
    { id: 'practice-session', title: 'Sessão Prática', type: 'practice' },
    { id: 'completion', title: 'Conclusão', type: 'validation' },
  ];

  if (cognitiveProfile?.aiToolsExperience === 'novice') {
    // Adicionar mais passos explicativos para iniciantes
    baseSteps.splice(3, 0, 
      { id: 'ai-basics', title: 'O que é IA?', type: 'tutorial' },
      { id: 'safety-guidelines', title: 'Diretrizes de Segurança', type: 'tutorial' }
    );
  }

  return {
    steps: baseSteps,
    currentStepIndex: 0,
    adaptationLogic: {
      strugglingThreshold: cognitiveProfile?.aiToolsExperience === 'novice' ? 600 : 300, // seconds
      skipCriteria: cognitiveProfile?.aiToolsExperience === 'advanced' ? 'allow_skip' : 'require_completion',
      personalizedContent: generateInitialPersonalizedContent(cognitiveProfile),
    }
  };
}

function generateAdaptiveNextSteps(progress: OnboardingProgress, cognitiveProfile: any) {
  const nextSteps = [];
  const strugglingPoints = progress.strugglingPoints || [];
  const hasStrugglingPoints = strugglingPoints.length > 0;

  // Se usuário está com dificuldades, sugerir ajuda adicional
  if (hasStrugglingPoints) {
    nextSteps.push({
      type: 'help',
      title: 'Precisa de ajuda?',
      description: 'Detectamos que você pode estar com dificuldades. Que tal uma explicação adicional?',
      action: 'show_additional_help',
      priority: 'high'
    });
  }

  // Sugerir próximo passo baseado no progresso atual
  if (progress.currentStep < progress.totalSteps - 1) {
    const nextStep = progress.currentStep + 1;
    nextSteps.push({
      type: 'continue',
      title: `Passo ${nextStep + 1}`,
      description: getStepDescription(nextStep, cognitiveProfile),
      action: 'continue_onboarding',
      priority: 'medium'
    });
  }

  // Se completou, sugerir próximos passos
  if (progress.completionRate >= 100) {
    nextSteps.push({
      type: 'next_phase',
      title: 'Explore a University',
      description: 'Continue aprendendo com nossos módulos estruturados',
      action: 'go_to_university',
      priority: 'medium'
    });
  }

  return nextSteps;
}

function getStepDescription(stepIndex: number, cognitiveProfile: any): string {
  const descriptions = [
    'Introdução personalizada',
    'Configure seu perfil de aprendizado',
    'Conheça seu primeiro AI Companion',
    'Aprenda a conversar efetivamente',
    'Faça upload de seu primeiro documento',
    'Descubra todas as funcionalidades',
    'Pratique suas novas habilidades',
    'Finalize e comemore seu progresso'
  ];

  return descriptions[stepIndex] || 'Próximo passo do onboarding';
}
