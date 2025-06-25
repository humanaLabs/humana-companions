'use client';

import { useState, useEffect } from 'react';
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

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface CreateRoleModalProps {
  organizations: Organization[];
  isMasterAdmin: boolean;
  onCreateSuccess: () => void;
}

// Permissões disponíveis (simplificado para o exemplo)
const AVAILABLE_PERMISSIONS: Permission[] = [
  // Administração
  { id: 'admin.users.view', name: 'Visualizar Usuários', category: 'Administração', description: 'Ver lista de usuários' },
  { id: 'admin.users.create', name: 'Criar Usuários', category: 'Administração', description: 'Criar novos usuários' },
  { id: 'admin.users.edit', name: 'Editar Usuários', category: 'Administração', description: 'Editar informações de usuários' },
  { id: 'admin.users.delete', name: 'Excluir Usuários', category: 'Administração', description: 'Excluir usuários do sistema' },
  
  // Companions
  { id: 'companions.view', name: 'Visualizar Companions', category: 'Companions', description: 'Ver companions disponíveis' },
  { id: 'companions.create', name: 'Criar Companions', category: 'Companions', description: 'Criar novos companions' },
  { id: 'companions.edit', name: 'Editar Companions', category: 'Companions', description: 'Editar companions existentes' },
  { id: 'companions.delete', name: 'Excluir Companions', category: 'Companions', description: 'Excluir companions' },
  
  // Organizações
  { id: 'organizations.view', name: 'Visualizar Organizações', category: 'Organizações', description: 'Ver organizações' },
  { id: 'organizations.create', name: 'Criar Organizações', category: 'Organizações', description: 'Criar novas organizações' },
  { id: 'organizations.edit', name: 'Editar Organizações', category: 'Organizações', description: 'Editar organizações' },
  { id: 'organizations.delete', name: 'Excluir Organizações', category: 'Organizações', description: 'Excluir organizações' },
];

export function CreateRoleModal({ 
  organizations, 
  isMasterAdmin, 
  onCreateSuccess 
}: CreateRoleModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    organizationId: '',
    permissions: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.displayName) {
      toast.error('Nome e Nome de Exibição são obrigatórios');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description || undefined,
          organizationId: formData.organizationId || undefined,
          permissions: formData.permissions,
        }),
      });

      if (response.ok) {
        toast.success(`Role "${formData.displayName}" criada com sucesso!`);
        setFormData({
          name: '',
          displayName: '',
          description: '',
          organizationId: '',
          permissions: [],
        });
        setOpen(false);
        onCreateSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar role');
      }
    } catch (error) {
      console.error('Erro ao criar role:', error);
      toast.error('Erro ao criar role');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSelectAllInCategory = (category: string) => {
    const categoryPermissions = AVAILABLE_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.id);
    
    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermissions])]
      }));
    }
  };

  // Agrupar permissões por categoria
  const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusIcon size={16} />
          Criar Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Role</DialogTitle>
          <DialogDescription>
            {isMasterAdmin 
              ? 'Crie uma role personalizada com permissões específicas.'
              : 'Crie uma role para sua organização.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Role */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Role (ID) *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: custom_manager"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Identificador único da role (minúsculas, sem espaços)
            </p>
          </div>

          {/* Nome de Exibição */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição *</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Ex: Gerente Personalizado"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
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
              placeholder="Descrição das responsabilidades da role"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
            />
          </div>

          {/* Master Admin - Escopo da Role */}
          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="scope">Escopo da Role</Label>
              <Select
                value={formData.organizationId || 'global'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  organizationId: value === 'global' ? '' : value 
                }))}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="Selecione o escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (todas organizações)</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Permissões */}
          <div className="space-y-4">
            <Label>Permissões *</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                const categoryPermissions = permissions.map(p => p.id);
                const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
                const someSelected = categoryPermissions.some(p => formData.permissions.includes(p));

                return (
                  <div key={category} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={allSelected}
                        onChange={() => handleSelectAllInCategory(category)}
                        className="rounded"
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="font-semibold text-foreground cursor-pointer"
                      >
                        {category} {someSelected && !allSelected && '(parcial)'}
                      </Label>
                    </div>
                    
                    <div className="ml-6 space-y-2">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="rounded mt-1"
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecionadas: {formData.permissions.length} permissões
            </p>
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
              {loading ? 'Criando...' : 'Criar Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 