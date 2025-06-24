'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface CreateTeamModalProps {
  organizations: Organization[];
  users: User[];
  teams: Team[];
  isMasterAdmin: boolean;
  onCreateSuccess: () => void;
}

export function CreateTeamModal({ 
  organizations, 
  users, 
  teams, 
  isMasterAdmin, 
  onCreateSuccess 
}: CreateTeamModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organizationId: '',
    managerId: '',
    parentTeamId: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.organizationId) {
      toast.error('Nome e Organização são obrigatórios');
      return;
    }

    // Master Admin deve especificar organização
    if (isMasterAdmin && !formData.organizationId) {
      toast.error('Organização é obrigatória para Master Admin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          organizationId: formData.organizationId,
          managerId: formData.managerId || undefined,
          parentTeamId: formData.parentTeamId || undefined,
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Time "${formData.name}" criado com sucesso!`);
        setFormData({ 
          name: '', 
          description: '', 
          organizationId: '', 
          managerId: '', 
          parentTeamId: '', 
          isActive: true 
        });
        setOpen(false);
        onCreateSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar time');
      }
    } catch (error) {
      console.error('Erro ao criar time:', error);
      toast.error('Erro ao criar time');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setFormData({ 
        name: '', 
        description: '', 
        organizationId: '', 
        managerId: '', 
        parentTeamId: '', 
        isActive: true 
      });
    }
  };

  // Filtrar usuários da organização selecionada para manager
  const availableManagers = users.filter(user => {
    // Se não tiver organização selecionada, mostrar todos
    if (!formData.organizationId) return true;
    // TODO: Filtrar por organização quando implementarmos a relação
    return true;
  });

  // Filtrar times da mesma organização para parent team
  const availableParentTeams = teams.filter(team => {
    // TODO: Filtrar por organização quando implementarmos a relação
    return team.id !== formData.name; // Evitar auto-referência
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusIcon size={16} />
          Criar Time
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Time</DialogTitle>
          <DialogDescription>
            {isMasterAdmin 
              ? 'Crie um novo time para uma organização específica.'
              : 'Crie um novo time para sua organização.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Time *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Desenvolvimento Frontend"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              type="text"
              placeholder="Descrição do time e suas responsabilidades"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
            />
          </div>

          {/* Master Admin - Seleção de Organização */}
          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="organization">Organização *</Label>
              <Select
                value={formData.organizationId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma organização" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manager do Time */}
          <div className="space-y-2">
            <Label htmlFor="manager">Manager do Time</Label>
            <Select
              value={formData.managerId || "none"}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                managerId: value === "none" ? "" : value 
              }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um manager (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem manager específico</SelectItem>
                {availableManagers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Pai (Hierarquia) */}
          <div className="space-y-2">
            <Label htmlFor="parentTeam">Time Pai (Hierarquia)</Label>
            <Select
              value={formData.parentTeamId || "none"}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                parentTeamId: value === "none" ? "" : value 
              }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time pai (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Time raiz (sem pai)</SelectItem>
                {availableParentTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      {team.description && (
                        <div className="text-xs text-muted-foreground">{team.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, isActive: value === 'active' }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? 'Criando...' : 'Criar Time'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 