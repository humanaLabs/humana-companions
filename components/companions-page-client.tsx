'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanionsList } from '@/components/companions-list';
import { CompanionForm } from '@/components/companion-form';
import { AICompanionGenerator } from '@/components/ai-companion-generator';
import type { Companion } from '@/lib/db/schema';

interface CompanionsPageClientProps {
  companions: Companion[];
}

export function CompanionsPageClient({ companions: initialCompanions }: CompanionsPageClientProps) {
  const [companions, setCompanions] = useState(initialCompanions);
  const [showForm, setShowForm] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);
  const router = useRouter();

  const handleCreateSuccess = () => {
    setShowForm(false);
    router.refresh();
  };

  const handleUpdateSuccess = () => {
    setEditingCompanion(null);
    router.refresh();
  };

  const handleAIGenerateSuccess = () => {
    router.refresh();
  };

  const handleDelete = async (companionId: string) => {
    setCompanions(prev => prev.filter(companion => companion.id !== companionId));
  };

  const handleEdit = (companion: Companion) => {
    setEditingCompanion(companion);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingCompanion(null);
  };

  const handleCancelCreate = () => {
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-20 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold">Gerenciador de Companions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure e gerencie seus assistentes personalizados
            </p>
          </div>
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
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Novo Companion
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {showForm && (
          <CompanionForm 
            onSuccess={handleCreateSuccess}
            onCancel={handleCancelCreate}
          />
        )}

        {editingCompanion && (
          <CompanionForm 
            companion={editingCompanion}
            onSuccess={handleUpdateSuccess}
            onCancel={handleCancelEdit}
          />
        )}

        {!showForm && !editingCompanion && (
          <CompanionsList 
            companions={companions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            hideCreateButton={true}
          />
        )}
      </div>
    </div>
  );
} 