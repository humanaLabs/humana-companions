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
  category: z.enum(['response_quality', 'accuracy', 'helpfulness', 'speed', 'other']),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// GET /api/companions/[id]/feedback
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const feedback = await getCompanionFeedback(params.id);
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
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    const feedback = await createCompanionFeedback({
      companionId: params.id,
      userId: session.user.id,
      ...validatedData,
    });

    // Atualizar métricas de performance
    await updateCompanionPerformance(params.id);

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