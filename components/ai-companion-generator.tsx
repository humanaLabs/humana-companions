'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
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
  const [isGeneratingRole, setIsGeneratingRole] = useState(false);
  const [isGeneratingResponsibilities, setIsGeneratingResponsibilities] = useState(false);
  const [isRefiningResponsibilities, setIsRefiningResponsibilities] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [responsibilities, setResponsibilities] = useState('');

  const generateRole = async () => {
    if (!name.trim()) {
      toast.error('Digite o nome do Companion primeiro');
      return;
    }

    setIsGeneratingRole(true);
    
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Baseado no nome "${name.trim()}", gere uma descrição concisa (2-3 linhas) do papel que este Companion exerce em uma organização. Seja específico sobre suas responsabilidades principais e área de atuação. Responda apenas com a descrição, sem explicações extras.`
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar descrição do papel');

      const data = await response.json();
      
      if (data.text) {
        setRole(data.text.trim());
        toast.success('Descrição do papel gerada!');
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      toast.error('Erro ao gerar descrição do papel');
      console.error(error);
    } finally {
      setIsGeneratingRole(false);
    }
  };

  const generateResponsibilities = async () => {
    if (!name.trim() || !role.trim()) {
      toast.error('Preencha o nome e a descrição do papel primeiro');
      return;
    }

    setIsGeneratingResponsibilities(true);
    
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Baseado no nome "${name.trim()}" e papel "${role.trim()}", gere uma lista de 4-6 responsabilidades específicas (R&R) que este Companion deve executar. 

Formato: uma responsabilidade por linha iniciada com "- ".
Seja específico e acionável.
Responda apenas com a lista, sem explicações extras.`
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar responsabilidades');

      const data = await response.json();
      
      if (data.text) {
        setResponsibilities(data.text.trim());
        toast.success('Lista de responsabilidades gerada!');
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      toast.error('Erro ao gerar responsabilidades');
      console.error(error);
    } finally {
      setIsGeneratingResponsibilities(false);
    }
  };

  const refineResponsibilities = async () => {
    if (!responsibilities.trim()) {
      toast.error('Digite as responsabilidades primeiro');
      return;
    }

    const originalText = responsibilities.trim();
    setIsRefiningResponsibilities(true);
    
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Refine e melhore esta lista de responsabilidades, tornando-a mais específica, acionável e bem estruturada:

${originalText}

Mantenha o formato de lista com "- " e responda apenas com a lista melhorada.`
        }),
      });

      if (!response.ok) throw new Error('Falha ao refinar responsabilidades');

      const data = await response.json();
      
      if (data.text) {
        setResponsibilities(data.text.trim());
        toast.success('Responsabilidades refinadas!');
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      toast.error('Erro ao refinar responsabilidades');
      console.error(error);
      setResponsibilities(originalText); // Restaurar texto original em caso de erro
    } finally {
      setIsRefiningResponsibilities(false);
    }
  };

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
      console.log('Generated companion:', generatedCompanion); // Debug

      // Depois, criar o companion no banco de dados
      const createResponse = await fetch('/api/companions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedCompanion),
      });

      console.log('Create response status:', createResponse.status); // Debug

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('Create companion error:', errorData); // Debug
        throw new Error(errorData.error || 'Falha ao criar companion');
      }

      const createdCompanion = await createResponse.json();
      console.log('Created companion:', createdCompanion); // Debug

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
              <div className="flex gap-2">
                <Input
                  id="ai-name"
                  placeholder="Ex: Chief AI Strategist"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isGenerating || isGeneratingRole}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRole}
                  disabled={isGenerating || isGeneratingRole || !name.trim()}
                  className="px-3"
                  title="Gerar descrição do papel com IA"
                >
                  {isGeneratingRole ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-role">2. Descrição do papel que ele exerce *</Label>
              <div className="flex gap-2">
                <Textarea
                  id="ai-role"
                  placeholder="Ex: Responsável por traduzir a visão do CEO em estratégias acionáveis de IA nos produtos e cultura da organização"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isGenerating || isGeneratingRole || isGeneratingResponsibilities}
                  rows={3}
                  className="flex-1"
                />
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateResponsibilities}
                    disabled={isGenerating || isGeneratingResponsibilities || !name.trim() || !role.trim()}
                    className="px-3 h-8"
                    title="Gerar lista de responsabilidades com IA"
                  >
                    {isGeneratingResponsibilities ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-responsibilities">3. Lista de responsabilidades (R&R) *</Label>
              <div className="flex gap-2">
                <Textarea
                  id="ai-responsibilities"
                  placeholder="Ex: 
- Criar frameworks de decisão para priorização de produtos com IA
- Mapear oportunidades de IA aplicada alinhadas à cultura da empresa
- Comunicar a visão de IA para clientes, investidores e equipe"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  disabled={isGenerating || isGeneratingResponsibilities || isRefiningResponsibilities}
                  rows={5}
                  className="flex-1"
                />
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refineResponsibilities}
                    disabled={isGenerating || isRefiningResponsibilities || !responsibilities.trim()}
                    className="px-3 h-8"
                    title="Refinar responsabilidades com IA"
                  >
                    {isRefiningResponsibilities ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Liste uma responsabilidade por linha ou separe com vírgulas
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isGeneratingRole || isGeneratingResponsibilities || isRefiningResponsibilities}
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
              disabled={isGenerating || isGeneratingRole || isGeneratingResponsibilities || isRefiningResponsibilities}
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