'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Companion } from '@/lib/db/schema';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PlusIcon, PencilEditIcon, TrashIcon } from './icons';
import { CompanionForm } from './companion-form';

interface CompanionsListProps {
  companions: Companion[];
}

export function CompanionsList({ companions }: CompanionsListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);
  const router = useRouter();

  const handleDelete = async (companionId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este companion?');
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/companions/${companionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir companion');
      }

      toast.success('Companion excluído com sucesso!');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao excluir companion');
    }
  };

  if (isCreating || editingCompanion) {
    return (
      <CompanionForm
        companion={editingCompanion}
        onCancel={() => {
          setIsCreating(false);
          setEditingCompanion(null);
        }}
        onSuccess={() => {
          setIsCreating(false);
          setEditingCompanion(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <PlusIcon size={16} />
          Novo Companion
        </Button>
      </div>

      {companions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              Nenhum companion encontrado.
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Crie seu primeiro companion para começar!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companions.map((companion) => (
            <Card key={companion.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{companion.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCompanion(companion)}
                      className="size-8 p-0"
                    >
                      <PencilEditIcon size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(companion.id)}
                      className="size-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {companion.instruction}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Criado em {new Date(companion.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 