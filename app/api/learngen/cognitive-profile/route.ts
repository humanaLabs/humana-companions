import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { userCognitiveProfile } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CreateCognitiveProfileRequest, UserCognitiveProfile } from '@/lib/types';

// Schema de validação para criação de perfil cognitivo
const createCognitiveProfileSchema = z.object({
  primaryCognitiveStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']),
  secondaryCognitiveStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
  adaptationLevel: z.enum(['high', 'medium', 'low']),
  aiToolsExperience: z.enum(['novice', 'intermediate', 'advanced']),
  businessContext: z.enum(['individual', 'team', 'organization']),
  technicalSkills: z.enum(['basic', 'intermediate', 'advanced']),
  primaryGoal: z.string().min(1, 'Objetivo principal é obrigatório'),
  secondaryGoals: z.array(z.string()).optional().default([]),
  timeframe: z.enum(['immediate', 'short-term', 'long-term']),
  role: z.string().optional(),
  department: z.string().optional(),
  useCase: z.string().optional(),
  teamSize: z.number().int().positive().optional(),
});

// GET /api/learngen/cognitive-profile - Obter perfil cognitivo do usuário
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const profile = await db
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

    if (profile.length === 0) {
      return NextResponse.json({ 
        profile: null,
        needsAssessment: true,
        message: 'Perfil cognitivo não encontrado. Assessment necessário.'
      });
    }

    return NextResponse.json({ 
      profile: {
        ...profile[0],
        createdAt: profile[0].createdAt,
        updatedAt: profile[0].updatedAt,
      } as UserCognitiveProfile,
      needsAssessment: false
    });
  } catch (error) {
    console.error('Erro ao buscar perfil cognitivo:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar perfil cognitivo' },
      { status: 500 }
    );
  }
}

// POST /api/learngen/cognitive-profile - Criar ou atualizar perfil cognitivo
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationId, ...profileData } = body;
    
    // Validar dados de entrada
    const validatedData = createCognitiveProfileSchema.parse(profileData);

    // Verificar se já existe um perfil
    const existingProfile = await db
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

    let profile: UserCognitiveProfile;

    if (existingProfile.length > 0) {
      // Atualizar perfil existente
      const [updatedProfile] = await db
        .update(userCognitiveProfile)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(userCognitiveProfile.id, existingProfile[0].id))
        .returning();

      profile = {
        ...updatedProfile,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
      } as UserCognitiveProfile;
    } else {
      // Criar novo perfil
      const [newProfile] = await db
        .insert(userCognitiveProfile)
        .values({
          ...validatedData,
          userId: session.user.id,
          organizationId: organizationId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      profile = {
        ...newProfile,
        createdAt: newProfile.createdAt,
        updatedAt: newProfile.updatedAt,
      } as UserCognitiveProfile;
    }

    // Gerar adaptações personalizadas baseadas no perfil
    const personalizedAdaptations = generatePersonalizedAdaptations(profile);

    return NextResponse.json({ 
      profile,
      personalizedAdaptations,
      message: existingProfile.length > 0 ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso'
    }, { status: existingProfile.length > 0 ? 200 : 201 });

  } catch (error) {
    console.error('Erro ao criar/atualizar perfil cognitivo:', error);
    
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
      { error: 'Falha ao processar perfil cognitivo' },
      { status: 500 }
    );
  }
}

// Função para gerar adaptações personalizadas baseadas no perfil cognitivo
function generatePersonalizedAdaptations(profile: UserCognitiveProfile) {
  const adaptations: any = {
    onboardingStrategy: 'default',
    preferredContentTypes: [],
    learningPace: 'medium',
    interactionStyle: 'balanced',
    feedbackPreferences: [],
    recommendedModules: [],
  };

  // Adaptações baseadas no estilo cognitivo primário
  switch (profile.primaryCognitiveStyle) {
    case 'visual':
      adaptations.preferredContentTypes = ['interactive', 'video'];
      adaptations.onboardingStrategy = 'visual-heavy';
      adaptations.interactionStyle = 'diagram-focused';
      adaptations.feedbackPreferences = ['visual-progress', 'charts', 'infographics'];
      break;
    
    case 'auditory':
      adaptations.preferredContentTypes = ['video', 'interactive'];
      adaptations.onboardingStrategy = 'explanation-focused';
      adaptations.interactionStyle = 'conversation-style';
      adaptations.feedbackPreferences = ['audio-cues', 'verbal-feedback'];
      break;
    
    case 'kinesthetic':
      adaptations.preferredContentTypes = ['hands-on', 'interactive'];
      adaptations.onboardingStrategy = 'practice-first';
      adaptations.interactionStyle = 'action-oriented';
      adaptations.feedbackPreferences = ['immediate-feedback', 'progress-bars'];
      break;
    
    case 'reading':
      adaptations.preferredContentTypes = ['quiz', 'interactive'];
      adaptations.onboardingStrategy = 'content-heavy';
      adaptations.interactionStyle = 'detailed-explanations';
      adaptations.feedbackPreferences = ['detailed-reports', 'written-feedback'];
      break;
  }

  // Adaptações baseadas na experiência com IA
  switch (profile.aiToolsExperience) {
    case 'novice':
      adaptations.learningPace = 'slow';
      adaptations.recommendedModules = ['ai-companions-fundamentals'];
      break;
    
    case 'intermediate':
      adaptations.learningPace = 'medium';
      adaptations.recommendedModules = ['ai-companions-fundamentals', 'advanced-features'];
      break;
    
    case 'advanced':
      adaptations.learningPace = 'fast';
      adaptations.recommendedModules = ['advanced-features', 'best-practices'];
      break;
  }

  // Adaptações baseadas no contexto empresarial
  if (profile.businessContext === 'organization' && profile.teamSize && profile.teamSize > 10) {
    adaptations.recommendedModules.push('enterprise-features', 'team-collaboration');
  }

  return adaptations;
} 