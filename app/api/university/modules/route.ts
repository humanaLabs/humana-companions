import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { learningModule, learningLesson, userLearningProgress } from '@/lib/db/schema';
import { eq, and, desc, asc, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { LearningModule, LearningLesson } from '@/lib/types';

// GET /api/university/modules - Listar módulos disponíveis
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category'); // getting-started, advanced-usage, etc.
    const includeProgress = searchParams.get('includeProgress') === 'true';

    // Buscar módulos
    const whereConditions = [eq(learningModule.isActive, true)];
    
    if (organizationId) {
      whereConditions.push(eq(learningModule.organizationId, organizationId));
    } else {
      whereConditions.push(isNull(learningModule.organizationId)); // módulos globais
    }
    
    if (category) {
      whereConditions.push(eq(learningModule.category, category));
    }

    const modules = await db
      .select({
        id: learningModule.id,
        title: learningModule.title,
        description: learningModule.description,
        slug: learningModule.slug,
        category: learningModule.category,
        duration: learningModule.duration,
        difficultyLevel: learningModule.difficultyLevel,
        learningObjectives: learningModule.learningObjectives,
        isActive: learningModule.isActive,
        sortOrder: learningModule.sortOrder,
        prerequisites: learningModule.prerequisites,
        createdAt: learningModule.createdAt,
        updatedAt: learningModule.updatedAt,
      })
      .from(learningModule)
      .where(and(...whereConditions))
      .orderBy(asc(learningModule.sortOrder));

    // Enriquecer com informações de progresso do usuário se solicitado
    let enrichedModules: any[] = modules;

    if (includeProgress) {
      enrichedModules = await Promise.all(
        modules.map(async (module) => {
          // Buscar progresso do usuário neste módulo
          const progress = await db
            .select()
            .from(userLearningProgress)
            .where(
              and(
                eq(userLearningProgress.userId, session.user.id),
                eq(userLearningProgress.moduleId, module.id)
              )
            )
            .limit(1);

          // Buscar lições do módulo
          const lessons = await db
            .select({
              id: learningLesson.id,
              title: learningLesson.title,
              description: learningLesson.description,
              slug: learningLesson.slug,
              type: learningLesson.type,
              duration: learningLesson.duration,
              sortOrder: learningLesson.sortOrder,
              isActive: learningLesson.isActive,
            })
            .from(learningLesson)
            .where(
              and(
                eq(learningLesson.moduleId, module.id),
                eq(learningLesson.isActive, true)
              )
            )
            .orderBy(asc(learningLesson.sortOrder));

          return {
            ...module,
            lessons,
            userProgress: progress[0] || null,
            lessonCount: lessons.length,
            completedLessons: progress[0]?.progressPercentage 
              ? Math.floor((progress[0].progressPercentage / 100) * lessons.length)
              : 0,
          };
        })
      );
    }

    // Agrupar por categoria para melhor organização
    const modulesByCategory = enrichedModules.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      modules: enrichedModules,
      modulesByCategory,
      totalModules: enrichedModules.length,
      categories: Object.keys(modulesByCategory),
    });

  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar módulos' },
      { status: 500 }
    );
  }
} 