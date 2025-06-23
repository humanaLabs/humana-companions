import { auth } from '@/app/(auth)/auth';
import { NextRequest, NextResponse } from 'next/server';

interface LayoutData {
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    type: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

// Armazenamento temporário em memória (apenas para desenvolvimento experimental)
const layouts = new Map<string, LayoutData>();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const layoutData: LayoutData = await request.json();
    
    // Salvar layout para o usuário (em produção, salvaria no banco)
    layouts.set(session.user.id, layoutData);
    
    console.log('Layout salvo para usuário:', session.user.id);
    console.log('Dados:', JSON.stringify(layoutData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Layout salvo com sucesso (experimental)' 
    });
  } catch (error) {
    console.error('Erro ao salvar layout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Recuperar layout do usuário
    const layoutData = layouts.get(session.user.id);
    
    if (!layoutData) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'Nenhum layout salvo encontrado' 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: layoutData 
    });
  } catch (error) {
    console.error('Erro ao carregar layout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 