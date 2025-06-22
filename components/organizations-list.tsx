'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Briefcase, Target, Edit, Trash2, MoreVertical, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from './toast';
import type { OrganizationStructure } from '@/lib/types';

interface OrganizationsListProps {
  organizations: OrganizationStructure[];
  onEdit: (organization: OrganizationStructure) => void;
  onDelete: (organizationId: string) => void;
}

export function OrganizationsList({ organizations, onEdit, onDelete }: OrganizationsListProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (organization: OrganizationStructure) => {
    router.push(`/organizations/${organization.id}`);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(id);
        toast({
          type: 'success',
          description: 'Organização deletada com sucesso!',
        });
      } else {
        throw new Error('Falha ao deletar organização');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        type: 'error',
        description: 'Erro ao deletar organização. Tente novamente.',
      });
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma organização encontrada</h3>
        <p className="mt-2 text-muted-foreground">
          Comece criando sua primeira estrutura organizacional.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((organization) => (
          <div
            key={organization.id}
            className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg truncate">{organization.name}</h3>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(organization)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirm({ id: organization.id!, name: organization.name })}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {organization.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {organization.teams?.length || 0} equipes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-500" />
                <span className="text-sm">
                  {organization.positions?.length || 0} posições
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-500" />
                <span className="text-sm">
                  {organization.positions?.reduce((total, pos) => total + (pos.companions?.length || 0), 0) || 0} companions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  {organization.values?.length || 0} valores
                </span>
              </div>
            </div>

            {/* Tenant Config */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {organization.tenantConfig?.language || 'N/A'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {organization.tenantConfig?.llm_provider || 'N/A'}
              </Badge>
            </div>

            {/* Values Preview */}
            {organization.values && organization.values.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Valores principais:
                </p>
                <div className="flex flex-wrap gap-1">
                  {organization.values.slice(0, 3).map((value, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {value.name}
                    </Badge>
                  ))}
                  {organization.values.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{organization.values.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-muted-foreground">
              Criado em {new Date(organization.createdAt!).toLocaleDateString('pt-BR')}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a organização "{deleteConfirm?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === deleteConfirm?.id ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 