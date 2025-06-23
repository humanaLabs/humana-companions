import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { checkUserHasOrganization } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id || session.user.type === 'guest') {
      return NextResponse.json({ needsAutoCreate: false });
    }

    const hasOrganization = await checkUserHasOrganization(session.user.id);
    
    return NextResponse.json({ 
      needsAutoCreate: !hasOrganization,
      userId: session.user.id 
    });
  } catch (error) {
    console.error('Error checking auto-create need:', error);
    return NextResponse.json({ needsAutoCreate: false });
  }
} 