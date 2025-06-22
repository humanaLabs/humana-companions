import { auth } from '@/app/(auth)/auth';
import { getCompanionsByUserId } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { CompanionsList } from '@/components/companions-list';

export default async function CompanionsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const companions = await getCompanionsByUserId({ 
    userId: session.user.id! 
  });

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Companions</h1>
          <p className="text-muted-foreground">
            Gerencie seus assistentes personalizados
          </p>
        </div>
      </div>
      
      <CompanionsList companions={companions} />
    </div>
  );
} 