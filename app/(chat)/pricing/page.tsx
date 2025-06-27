// Página de preços dos planos
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';

export default function PricingPage() {
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('/api/user/permissions');
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan);
        }
      } catch {}
    }
    fetchPlan();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Planos e Preços"
        description="Escolha o plano ideal para você."
        badge="Pricing"
        showBackButton={true}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plano Free */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-foreground">
                    Free
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Grátis
                  </span>
                  {userPlan === 'free' && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full ml-2">
                      Plano em uso
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  Ideal para experimentar a plataforma.
                </p>
                <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} /> Até 10 mensagens no chat
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} /> Acesso básico aos Companions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} /> Suporte limitado
                  </li>
                </ul>
              </div>
              <Link href="/register" className="w-full mt-4">
                <Button className="w-full" variant="default">
                  Começar grátis
                </Button>
              </Link>
            </div>
            {/* Plano Pro */}
            <div className="bg-card border-2 border-primary rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-primary">Pro</span>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Recomendado
                  </span>
                  {userPlan === 'pro' && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full ml-2">
                      Plano em uso
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  Para quem quer aproveitar tudo sem limites.
                </p>
                <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} /> Mensagens ilimitadas no chat
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} /> Prioridade no suporte
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} /> Novidades e recursos exclusivos
                  </li>
                </ul>
              </div>
              <Link href="/upgrade" className="w-full mt-4">
                <Button className="w-full" variant="default">
                  Assinar Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
