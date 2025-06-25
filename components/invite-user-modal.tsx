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

interface InviteUserModalProps {
  roles: Role[];
  organizations: Organization[];
  isMasterAdmin: boolean;
  onInviteSuccess: () => void;
}

export function InviteUserModal({ 
  roles, 
  organizations, 
  isMasterAdmin, 
  onInviteSuccess 
}: InviteUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    roleId: '',
    organizationId: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.roleId) {
      toast.error('Email e Role são obrigatórios');
      return;
    }

    if (isMasterAdmin && !formData.organizationId) {
      toast.error('Organização é obrigatória para Master Admin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          roleId: formData.roleId,
          organizationId: formData.organizationId || null,
          message: formData.message || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Convite enviado para ${formData.email}!`);
        setFormData({ email: '', roleId: '', organizationId: '', message: '' });
        setOpen(false);
        onInviteSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setFormData({ email: '', roleId: '', organizationId: '', message: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusIcon size={16} />
          Convidar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
          <DialogDescription>
            {isMasterAdmin 
              ? 'Envie um convite para um novo usuário se juntar a uma organização específica.'
              : 'Envie um convite para um novo usuário se juntar à sua organização.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
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

          {/* Master Admin - Seleção de Organização */}
          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="organization">Organização *</Label>
              <Select
                value={formData.organizationId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
              >
                <SelectTrigger disabled={loading}>
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

          {/* Mensagem personalizada */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
            <Input
              id="message"
              placeholder="Bem-vindo à nossa equipe!"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              disabled={loading}
            />
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
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 