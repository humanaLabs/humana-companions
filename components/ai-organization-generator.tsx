'use client';

import { useState } from 'react';
import { X, Bot, Building2, FileText, Network, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from './toast';
import type { OrganizationStructure } from '@/lib/types';

interface AIOrganizationGeneratorProps {
  onClose: () => void;
  onOrganizationCreated: (organization: OrganizationStructure) => void;
}

export function AIOrganizationGenerator({ onClose, onOrganizationCreated }: AIOrganizationGeneratorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orgChart: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.orgChart.trim()) {
      toast({
        type: 'error',
        description: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/organizations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar organização');
      }

      const newOrganization = await response.json();
      onOrganizationCreated(newOrganization);
      
      toast({
        type: 'success',
        description: 'Organização gerada com sucesso!',
      });
    } catch (error: any) {
      console.error('Error generating organization:', error);
      toast({
        type: 'error',
        description: error.message || 'Erro ao gerar organização. Tente novamente.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Gerar Organização com IA</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome da Organização */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nome da organização *
            </Label>
            <Input
              id="name"
              placeholder="Ex: Humana AI"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Descrição da Organização */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição da organização *
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Plataforma de aprendizado corporativo com IA integrada que aumenta a inteligência das empresas."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
          </div>

          {/* Estrutura Organizacional */}
          <div className="space-y-2">
            <Label htmlFor="orgChart" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Estrutura organizacional (Org Chart) *
            </Label>
            <Textarea
              id="orgChart"
              placeholder="Liste os principais cargos e sua relação com a organização. Exemplo:
- CEO
- CPO (reporta ao CEO)
- Head de Educação (reporta ao CPO)
- SDR (reporta ao Head de Vendas)"
              value={formData.orgChart}
              onChange={(e) => handleInputChange('orgChart', e.target.value)}
              disabled={isGenerating}
              rows={6}
            />
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bot className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Como funciona:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• A IA criará uma estrutura organizacional completa</li>
                  <li>• Incluirá valores, equipes, posições e R&Rs automáticos</li>
                  <li>• Gerará companions especializados para cada cargo</li>
                  <li>• Você poderá editar tudo após a geração</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Gerar Organização
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 