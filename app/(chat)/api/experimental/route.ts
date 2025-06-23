import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'API Experimental ativa',
      status: 'experimental',
      features: [
        'components-lab',
        'api-playground', 
        'feature-previews'
      ],
      user: session.user.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na API experimental:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Log experimental data (não salva no banco por segurança)
    console.log('Dados experimentais recebidos:', {
      user: session.user.email,
      data: body,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Dados experimentais processados',
      received: body,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao processar dados experimentais:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 