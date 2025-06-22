'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import type { CompanionStructure } from '@/lib/types';

interface AICompanionGeneratorProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function AICompanionGenerator({ onSuccess, trigger }: AICompanionGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [responsibilities, setResponsibilities] = useState('');

  const handleGenerate = async () => {
    if (!name.trim() || !role.trim() || !responsibilities.trim()) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setIsGenerating(true);

    try {
      // Primeiro, gerar a estrutura usando IA
      const generateResponse = await fetch('/api/companions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          responsibilities: responsibilities.trim(),
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Falha ao gerar companion');
      }

      const { companion: generatedCompanion } = await generateResponse.json();

      // Depois, criar o companion no banco de dados
      const createResponse = await fetch('/api/companions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedCompanion),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Falha ao criar companion');
      }

      toast.success('Companion gerado e criado com sucesso!');
      
      // Resetar formulário
      setName('');
      setRole('');
      setResponsibilities('');
      setIsOpen(false);
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao gerar companion:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar companion');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar com IA
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Gerar Companion com IA
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Forneça as informações básicas e nossa IA irá gerar um Companion completo com todas as seções preenchidas.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-name">1. Nome do Companion *</Label>
              <Input
                id="ai-name"
                placeholder="Ex: Chief AI Strategist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-role">2. Descrição do papel que ele exerce *</Label>
              <Textarea
                id="ai-role"
                placeholder="Ex: Responsável por traduzir a visão do CEO em estratégias acionáveis de IA nos produtos e cultura da organização"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isGenerating}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-responsibilities">3. Lista de responsabilidades (R&R) *</Label>
              <Textarea
                id="ai-responsibilities"
                placeholder="Ex: 
- Criar frameworks de decisão para priorização de produtos com IA
- Mapear oportunidades de IA aplicada alinhadas à cultura da empresa
- Comunicar a visão de IA para clientes, investidores e equipe"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                disabled={isGenerating}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Liste uma responsabilidade por linha ou separe com vírgulas
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando Companion...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar AI Companion
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>💡 Dica:</strong> A IA irá gerar automaticamente expertises, fontes de conhecimento, 
              regras de comportamento, política de conteúdo, habilidades especializadas e respostas padrão 
              baseadas nas informações fornecidas.
            </p>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 