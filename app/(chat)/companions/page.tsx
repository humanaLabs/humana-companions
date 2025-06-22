import { auth } from '@/app/(auth)/auth';
import { getCompanionsByUserId } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { CompanionsPageClient } from '@/components/companions-page-client';

export default async function CompanionsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const companions = await getCompanionsByUserId({ 
    userId: session.user.id! 
  });

  return <CompanionsPageClient companions={companions} />;
} 