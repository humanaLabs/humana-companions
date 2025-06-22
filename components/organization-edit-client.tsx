'use client';

import { useState } from 'react';
import { ArrowLeft, Building2, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from './toast';
import type { OrganizationStructure } from '@/lib/types';
import { OrganizationFormFields } from './organization-form-fields';

interface OrganizationEditClientProps {
  organization: OrganizationStructure;
}

export function OrganizationEditClient({ organization }: OrganizationEditClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<OrganizationStructure>(organization);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        type: 'error',
        description: 'Nome e descrição são obrigatórios.',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar organização');
      }

      toast({
        type: 'success',
        description: 'Organização atualizada com sucesso!',
      });

      router.push('/organizations');
    } catch (error: any) {
      console.error('Error saving organization:', error);
      toast({
        type: 'error',
        description: error.message || 'Erro ao salvar organização. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/organizations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Editar Organização</h1>
            <p className="text-muted-foreground">
              Modifique a estrutura organizacional conforme necessário
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <OrganizationFormFields
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t">
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/organizations')} 
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
} 