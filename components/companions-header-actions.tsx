'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AICompanionGenerator } from '@/components/ai-companion-generator';

export function CompanionsHeaderActions() {
  const router = useRouter();

  const handleAIGenerateSuccess = () => {
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <AICompanionGenerator 
        onSuccess={handleAIGenerateSuccess}
        trigger={
          <Button variant="outline" className="flex items-center gap-2">
            <Sparkles size={16} />
            Gerar com IA
          </Button>
        }
      />
      <Button 
        onClick={() => {
          // Será implementado quando movermos a lógica do form
          window.dispatchEvent(new CustomEvent('companions:new'));
        }}
        className="flex items-center gap-2"
      >
        <Plus size={16} />
        Novo Companion
      </Button>
    </div>
  );
} 