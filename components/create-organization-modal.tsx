'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon } from '@/components/icons';
import { toast } from 'sonner';

interface CreateOrganizationModalProps {
  onCreateSuccess: () => void;
}

export function CreateOrganizationModal({ onCreateSuccess }: CreateOrganizationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    domain: '',
    industry: '',
    size: '',
    country: 'Brasil',
    timezone: 'America/Sao_Paulo',
    isActive: true,
    settings: {
      allowUserRegistration: false,
      requireEmailVerification: true,
      maxUsers: 100,
      maxCompanions: 50,
      maxTeams: 10,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.displayName) {
      toast.error('Nome e Nome de Exibição são obrigatórios');
      return;
    }

    if (!formData.domain) {
      toast.error('Domínio é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description || undefined,
          domain: formData.domain,
          industry: formData.industry || undefined,
          size: formData.size || undefined,
          country: formData.country,
          timezone: formData.timezone,
          isActive: formData.isActive,
          settings: formData.settings,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Organização "${formData.displayName}" criada com sucesso!`);
        setFormData({
          name: '',
          displayName: '',
          description: '',
          domain: '',
          industry: '',
          size: '',
          country: 'Brasil',
          timezone: 'America/Sao_Paulo',
          isActive: true,
          settings: {
            allowUserRegistration: false,
            requireEmailVerification: true,
            maxUsers: 100,
            maxCompanions: 50,
            maxTeams: 10,
          }
        });
        setOpen(false);
        onCreateSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar organização');
      }
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      toast.error('Erro ao criar organização');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusIcon size={16} />
          Criar Organização
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Organização</DialogTitle>
          <DialogDescription>
            Crie uma nova organização no sistema. Apenas Master Admin pode realizar esta ação.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome (ID) *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: humana-inc"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                }))}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição *</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ex: Humana Inc."
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição da organização..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domínio *</Label>
            <Input
              id="domain"
              type="text"
              placeholder="Ex: humana.com"
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value.toLowerCase() }))}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Setor</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Tecnologia</SelectItem>
                  <SelectItem value="healthcare">Saúde</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="education">Educação</SelectItem>
                  <SelectItem value="retail">Varejo</SelectItem>
                  <SelectItem value="manufacturing">Manufatura</SelectItem>
                  <SelectItem value="consulting">Consultoria</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Tamanho</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (1-10)</SelectItem>
                  <SelectItem value="small">Pequena (11-50)</SelectItem>
                  <SelectItem value="medium">Média (51-200)</SelectItem>
                  <SelectItem value="large">Grande (201-1000)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Organização'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 