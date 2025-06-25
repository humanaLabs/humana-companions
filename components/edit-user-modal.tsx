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
import { PencilEditIcon } from '@/components/icons';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface Organization {
  id: string;
  name: string;
}

interface EditUserData {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'invited' | 'suspended';
  role: Role;
  organizationName?: string;
  isMasterAdmin?: boolean;
}

interface EditUserModalProps {
  user: EditUserData;
  roles: Role[];
  organizations: Organization[];
  isMasterAdmin: boolean;
  onEditSuccess: () => void;
}

export function EditUserModal({ 
  user, 
  roles, 
  organizations, 
  isMasterAdmin, 
  onEditSuccess 
}: EditUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    roleId: user.role.id,
    status: user.status,
    organizationId: '',
    isMasterAdminFlag: user.isMasterAdmin || false,
  });

  useEffect(() => {
    if (open && isMasterAdmin) {
      loadUserOrganization();
    }
  }, [open, isMasterAdmin]);

  const loadUserOrganization = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setFormData(prev => ({
          ...prev,
          organizationId: userData.organizationId || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar organização do usuário:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.roleId) {
      toast.error('Email e Role são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          roleId: formData.roleId,
          status: formData.status,
          organizationId: isMasterAdmin ? formData.organizationId || null : undefined,
          isMasterAdmin: isMasterAdmin ? formData.isMasterAdminFlag : undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Usuário atualizado com sucesso!');
        setOpen(false);
        onEditSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      // Reset form data
      setFormData({
        name: user.name || '',
        email: user.email,
        roleId: user.role.id,
        status: user.status,
        organizationId: '',
        isMasterAdminFlag: user.isMasterAdmin || false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <PencilEditIcon size={14} />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações do usuário {user.email}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome do usuário"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.roleId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}
            >
              <SelectTrigger disabled={loading}>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <div className="font-medium">{role.displayName}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
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
              value={formData.status}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, status: value as 'active' | 'invited' | 'suspended' }))
              }
            >
              <SelectTrigger disabled={loading}>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="invited">Convidado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Master Admin - Organização e Master Admin Flag */}
          {isMasterAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="organization">Organização</Label>
                <Select
                  value={formData.organizationId || "none"}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    organizationId: value === "none" ? "" : value 
                  }))}
                >
                  <SelectTrigger disabled={loading}>
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem organização específica</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="masterAdmin">Privilégios Master Admin</Label>
                <Select
                  value={formData.isMasterAdminFlag ? 'true' : 'false'}
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, isMasterAdminFlag: value === 'true' }))
                  }
                >
                  <SelectTrigger disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Usuário Regular</SelectItem>
                    <SelectItem value="true">Master Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 