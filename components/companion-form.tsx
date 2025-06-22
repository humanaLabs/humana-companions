'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Companion } from '@/lib/db/schema';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface CompanionFormProps {
  companion?: Companion | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CompanionForm({ companion, onCancel, onSuccess }: CompanionFormProps) {
  const [name, setName] = useState(companion?.name || '');
  const [instruction, setInstruction] = useState(companion?.instruction || '');
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!companion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !instruction.trim()) {
      toast.error('Nome e instrução são obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditing 
        ? `/api/companions/${companion.id}`
        : '/api/companions';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          instruction: instruction.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar companion');
      }

      toast.success(
        isEditing 
          ? 'Companion atualizado com sucesso!' 
          : 'Companion criado com sucesso!'
      );
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar companion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Companion' : 'Novo Companion'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Assistente de Programação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instruction">Instrução</Label>
            <Textarea
              id="instruction"
              placeholder="Descreva como este companion deve se comportar e responder..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isLoading}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Esta instrução será usada como prompt do sistema para guiar o comportamento do companion.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 