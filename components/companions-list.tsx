'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Companion } from '@/lib/db/schema';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { PlusIcon, PencilEditIcon, TrashIcon } from './icons';
import { User } from 'lucide-react';

interface CompanionsListProps {
  companions: Companion[];
  onEdit?: (companion: Companion) => void;
  onDelete?: (companionId: string) => void;
  hideCreateButton?: boolean;
}

export function CompanionsList({ 
  companions, 
  onEdit, 
  onDelete: onDeleteProp, 
  hideCreateButton = false 
}: CompanionsListProps) {
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
      
      if (onDeleteProp) {
        onDeleteProp(companionId);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error('Erro ao excluir companion');
    }
  };

  // Se estiver usando as props externas, não renderizar o form aqui
  if ((isCreating || editingCompanion) && !onEdit) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Formulário de companion será exibido aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {companions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-medium mb-2">Nenhum companion configurado</h3>
          <p className="text-muted-foreground mb-4">
            Crie assistentes personalizados para diferentes tarefas e contextos.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            Criar Primeiro Companion
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {companions.map((companion) => (
            <Card key={companion.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{companion.name}</h3>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <User size={12} className="mr-1" />
                        Ativo
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      Instruções: {companion.instruction.substring(0, 100)}
                      {companion.instruction.length > 100 && '...'}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Criado em:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(companion.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onEdit) {
                          onEdit(companion);
                        } else {
                          setEditingCompanion(companion);
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <PencilEditIcon size={14} />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(companion.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon size={14} />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 