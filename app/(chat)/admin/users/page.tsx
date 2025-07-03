"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Search, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminUser {
  id: string;
  email: string;
  organizationId: string;
  isMasterAdmin: boolean;
  status: 'active' | 'invited' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  department?: string;
  team?: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'x-organization-id': '1', // Current organization
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data.users || []);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': '1',
        },
        body: JSON.stringify({
          email: inviteEmail,
          roleId: inviteRole,
          message: 'Welcome to Humana Companions!'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setInviteEmail('');
        setInviteRole('user');
        setShowInviteForm(false);
        fetchUsers(); // Refresh the list
      } else {
        setError(result.error || 'Failed to invite user');
      }
    } catch (err) {
      console.error('Failed to invite user:', err);
      setError('Failed to invite user');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      invited: "secondary",
      suspended: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      free: "outline",
      pro: "default",
      enterprise: "secondary"
    };
    return <Badge variant={colors[plan] || "outline"}>{plan}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários da organização com Service Layer
          </p>
        </div>
        <Button 
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite User Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar Novo Usuário</CardTitle>
            <CardDescription>
              Envie um convite para um novo usuário se juntar à organização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Função</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="master-admin">Master Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInviteUser}>
                Enviar Convite
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInviteForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="invited">Convidado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchUsers} variant="outline">
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários da Organização
            {!loading && <Badge variant="secondary">{users.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Convide novos usuários para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.role.displayName}
                        {user.department && ` • ${user.department}`}
                        {user.team && ` • ${user.team}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user.status)}
                    {getPlanBadge(user.plan)}
                    {user.isMasterAdmin && (
                      <Badge variant="destructive">Master</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <p>🏗️ <strong>Service Layer:</strong> AdminDomainService implementado</p>
            <p>🔒 <strong>Multi-tenant:</strong> organizationId sempre presente</p>
            <p>🎯 <strong>RBAC:</strong> Validação de permissões</p>
            <p>📊 <strong>Repository:</strong> MockAdminRepository (temporário)</p>
            <p>✅ <strong>Business Logic:</strong> Isolado da camada de dados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 