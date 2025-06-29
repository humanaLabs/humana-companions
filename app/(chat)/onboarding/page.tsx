import { LearnGenOnboarding } from '@/components/learngen-onboarding';
import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';

export default async function OnboardingPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Bem-vindo aos AI Companions
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Sua jornada personalizada de aprendizado começa aqui
          </p>
        </div>
        
        <LearnGenOnboarding 
          onComplete={() => {
            // Redirecionar para dashboard após completar onboarding
            window.location.href = '/';
          }}
        />
      </div>
    </div>
  );
} 