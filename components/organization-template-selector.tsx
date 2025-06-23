'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronRight, Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrganizationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: any;
}

interface OrganizationTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected: (template: any, metadata: any) => void;
}

const CATEGORY_ICONS = {
  technology: '💻',
  consulting: '📊',
  retail: '🛒',
  finance: '💰',
  healthcare: '🏥',
  education: '🎓',
};

const CATEGORY_COLORS = {
  technology: 'bg-blue-100 text-blue-800',
  consulting: 'bg-purple-100 text-purple-800',
  retail: 'bg-green-100 text-green-800',
  finance: 'bg-yellow-100 text-yellow-800',
  healthcare: 'bg-red-100 text-red-800',
  education: 'bg-indigo-100 text-indigo-800',
};

export function OrganizationTemplateSelector({
  isOpen,
  onClose,
  onTemplateSelected,
}: OrganizationTemplateSelectorProps) {
  const [templates, setTemplates] = useState<OrganizationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OrganizationTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/organizations/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateSelect = async (template: OrganizationTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/organizations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplate.id }),
      });

      if (response.ok) {
        const data = await response.json();
        onTemplateSelected(data.template, data.metadata);
        onClose();
      }
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateStats = (template: OrganizationTemplate) => {
    const structure = template.structure;
    return {
      companions: structure.companions?.length || 0,
    };
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Selecionar Template Organizacional
          </AlertDialogTitle>
          <AlertDialogDescription>
            Escolha um template pré-configurado para acelerar a criação da sua organização.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-6 h-[50vh]">
          {/* Template List */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {templates.map((template) => {
                const stats = getTemplateStats(template);
                const isSelected = selectedTemplate?.id === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS] || '🏢'}
                        </span>
                        <h3 className="font-semibold">{template.name}</h3>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS]}
                      >
                        {template.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {stats.companions} companions prontos
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-2 flex items-center justify-end">
                        <ChevronRight className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2 border-l pl-6 overflow-y-auto">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span>
                      {CATEGORY_ICONS[selectedTemplate.category as keyof typeof CATEGORY_ICONS] || '🏢'}
                    </span>
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Estrutura Organizacional Sugerida */}
                {selectedTemplate.structure.orgChart && (
                  <div>
                    <h4 className="font-medium mb-2">Estrutura Organizacional</h4>
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="text-muted-foreground">{selectedTemplate.structure.orgChart}</p>
                    </div>
                  </div>
                )}

                {/* Companions Prontos */}
                {selectedTemplate.structure.companions && selectedTemplate.structure.companions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Companions Prontos ({selectedTemplate.structure.companions.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedTemplate.structure.companions.map((companion: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded text-sm">
                          <div className="font-medium flex items-center gap-2">
                            <Bot className="h-3 w-3" />
                            {companion.name}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            <strong>Papel:</strong> {companion.role}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {companion.description}
                          </div>
                          {companion.expertises && companion.expertises.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {companion.expertises.slice(0, 3).map((expertise: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {expertise.area}
                                </Badge>
                              ))}
                              {companion.expertises.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{companion.expertises.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Selecione um template para ver os detalhes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedTemplate || isLoading}
          >
            {isLoading ? 'Aplicando...' : 'Usar Template'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 