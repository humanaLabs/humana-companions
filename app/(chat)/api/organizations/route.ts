import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  createOrganization, 
  getOrganizationsForUser, 
  checkCanCreateOrganization,
  getUserById 
} from '@/lib/db/queries';
import { createOrganizationSchema } from './schema';

export async function GET() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user info to check if is master admin
    const user = await getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizations = await getOrganizationsForUser(
      session.user.id, 
      user.isMasterAdmin
    );
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user can create organizations (only master admin)
    const canCreate = await checkCanCreateOrganization(session.user.id);
    
    if (!canCreate) {
      return NextResponse.json(
        { 
          error: 'Acesso negado', 
          message: 'Apenas administradores master podem criar novas organizações' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createOrganizationSchema.parse(body);

    const organization = await createOrganization(
      validatedData.name,
      validatedData.description,
      validatedData.tenantConfig,
      validatedData.values,
      validatedData.teams,
      validatedData.positions,
      validatedData.orgUsers,
      session.user.id
    );

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    
    if (error.name === 'ZodError') {
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