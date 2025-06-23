import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  createCompanionFeedback, 
  getCompanionFeedback,
  updateCompanionPerformance 
} from '@/lib/db/queries';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.enum(['positive', 'negative', 'suggestion']),
  category: z.enum(['accuracy', 'helpfulness', 'relevance', 'tone', 'completeness']),
  rating: z.number().min(1).max(5),
  comment: z.string(),
});

// GET /api/companions/[id]/feedback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const feedback = await getCompanionFeedback(id);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/companions/[id]/feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    const feedback = await createCompanionFeedback({
      companionId: id,
      userId: session.user.id,
      ...validatedData,
    });

    // Atualizar métricas de performance
    await updateCompanionPerformance(id, {
      lastFeedbackAt: new Date(),
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error creating feedback:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 