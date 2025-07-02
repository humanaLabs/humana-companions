import { auth } from '@/app/(auth)/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

const generateTextSchema = z.object({
  prompt: z.string().min(1, 'Prompt é obrigatório'),
  context: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, context } = generateTextSchema.parse(body);

    // Usar o modelo padrão do sistema
    const model = myProvider.languageModel(DEFAULT_CHAT_MODEL);
    
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Retornar resposta simples
    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error('Erro ao gerar texto:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao gerar texto' },
      { status: 500 }
    );
  }
} 