'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Settings, Users, Search, Edit, Plus, Crown, User, BarChart3, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UserQuota {
  id: string;
  email: string;
  isMasterAdmin: boolean;
  quota: {
    quotaType: string;
    messagesPerDay: number;
    messagesPerMonth: number;
    companionsLimit: number;
    documentsLimit: number;
    storageLimit: number;
    mcpServersLimit: number;
  };
  usage: {
    dailyMessages: number;
    monthlyMessages: number;
    companions: number;
    documents: number;
    storageUsed: number;
    mcpServers: number;
  };
}

const quotaTypes = {
  'standard': { label: 'Standard', color: 'bg-gray-500' },
  'premium': { label: 'Premium', color: 'bg-blue-500' },
  'enterprise': { label: 'Enterprise', color: 'bg-purple-500' },
  'unlimited': { label: 'Unlimited', color: 'bg-green-500' }
};

export function AdminQuotasPageClient() {
  const [users, setUsers] = useState<UserQuota[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserQuota | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    quotaExceeded: 0,
    totalUsage: 0
  });

  // Carregar dados dos usuários
  useEffect(() => {
    loadUsersData();
  }, []);

  // Filtrar usuários
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.quota.quotaType === filterType);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterType]);

  // Calcular estatísticas
  useEffect(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.usage.monthlyMessages > 0).length;
    const quotaExceeded = users.filter(u => 
      u.usage.dailyMessages >= u.quota.messagesPerDay ||
      u.usage.monthlyMessages >= u.quota.messagesPerMonth ||
      u.usage.companions >= u.quota.companionsLimit ||
      u.usage.documents >= u.quota.documentsLimit
    ).length;
    const totalUsage = users.reduce((sum, u) => sum + u.usage.monthlyMessages, 0);

    setStats({ totalUsers, activeUsers, quotaExceeded, totalUsage });
  }, [users]);

  const loadUsersData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Carregando dados de usuários...');
      const response = await fetch('/api/admin/users/quotas');
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro ao carregar dados dos usuários');
    } finally {
      setLoading(false);
    }
  };

  const updateUserQuota = async (userId: string, newQuota: any) => {
    try {
      const response = await fetch('/api/quotas/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...newQuota
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar quota');
      }

      toast.success('Quota atualizada com sucesso!');
      await loadUsersData(); // Recarregar dados
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar quota:', error);
      toast.error('Erro ao atualizar quota');
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-2">Carregando dados dos usuários...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="size-12 text-red-500" />
            <div>
              <h3 className="font-medium text-lg">Erro ao carregar dados</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadUsersData} variant="outline">
                <RefreshCw className="size-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.href = '/login'} variant="default">
                Fazer Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="size-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="size-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="size-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Quota Excedida</p>
                <p className="text-2xl font-bold">{stats.quotaExceeded}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="size-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Mensagens/Mês</p>
                <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar Usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email ou ID do usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="filter">Tipo de Quota</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Quotas ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Gerencie quotas e monitore o uso de recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo de Quota</TableHead>
                <TableHead>Mensagens (Dia/Mês)</TableHead>
                <TableHead>Companions</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead>Storage (MB)</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {user.isMasterAdmin ? <Crown className="size-4 text-yellow-500" /> : <User className="size-4 text-muted-foreground" />}
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${quotaTypes[user.quota.quotaType as keyof typeof quotaTypes]?.color || 'bg-gray-500'} text-white`}>
                      {quotaTypes[user.quota.quotaType as keyof typeof quotaTypes]?.label || user.quota.quotaType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs">
                          <span>Dia: {user.usage.dailyMessages}/{user.quota.messagesPerDay}</span>
                          <span>{getUsagePercentage(user.usage.dailyMessages, user.quota.messagesPerDay).toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(user.usage.dailyMessages, user.quota.messagesPerDay)} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs">
                          <span>Mês: {user.usage.monthlyMessages}/{user.quota.messagesPerMonth}</span>
                          <span>{getUsagePercentage(user.usage.monthlyMessages, user.quota.messagesPerMonth).toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(user.usage.monthlyMessages, user.quota.messagesPerMonth)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="text-sm font-medium">{user.usage.companions}/{user.quota.companionsLimit}</div>
                      <Progress 
                        value={getUsagePercentage(user.usage.companions, user.quota.companionsLimit)} 
                        className="h-1 mt-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="text-sm font-medium">{user.usage.documents}/{user.quota.documentsLimit}</div>
                      <Progress 
                        value={getUsagePercentage(user.usage.documents, user.quota.documentsLimit)} 
                        className="h-1 mt-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="text-sm font-medium">{user.usage.storageUsed}/{user.quota.storageLimit}</div>
                      <Progress 
                        value={getUsagePercentage(user.usage.storageUsed, user.quota.storageLimit)} 
                        className="h-1 mt-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="size-3 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nenhum usuário encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros de busca.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Quota de Usuário</DialogTitle>
            <DialogDescription>
              Altere os limites de recursos para {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <EditQuotaForm 
              user={selectedUser} 
              onSave={updateUserQuota}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para formulário de edição
function EditQuotaForm({ 
  user, 
  onSave, 
  onCancel 
}: { 
  user: UserQuota; 
  onSave: (userId: string, quota: any) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    quotaType: user.quota.quotaType,
    messagesPerDay: user.quota.messagesPerDay,
    messagesPerMonth: user.quota.messagesPerMonth,
    companionsLimit: user.quota.companionsLimit,
    documentsLimit: user.quota.documentsLimit,
    storageLimit: user.quota.storageLimit,
    mcpServersLimit: user.quota.mcpServersLimit
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quotaType">Tipo de Quota</Label>
          <Select value={formData.quotaType} onValueChange={(value) => setFormData({ ...formData, quotaType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="messagesPerDay">Mensagens por Dia</Label>
          <Input
            type="number"
            value={formData.messagesPerDay}
            onChange={(e) => setFormData({ ...formData, messagesPerDay: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="messagesPerMonth">Mensagens por Mês</Label>
          <Input
            type="number"
            value={formData.messagesPerMonth}
            onChange={(e) => setFormData({ ...formData, messagesPerMonth: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="companionsLimit">Limite de Companions</Label>
          <Input
            type="number"
            value={formData.companionsLimit}
            onChange={(e) => setFormData({ ...formData, companionsLimit: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="documentsLimit">Limite de Documentos</Label>
          <Input
            type="number"
            value={formData.documentsLimit}
            onChange={(e) => setFormData({ ...formData, documentsLimit: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="storageLimit">Limite de Storage (MB)</Label>
          <Input
            type="number"
            value={formData.storageLimit}
            onChange={(e) => setFormData({ ...formData, storageLimit: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="mcpServersLimit">Limite de MCP Servers</Label>
          <Input
            type="number"
            value={formData.mcpServersLimit}
            onChange={(e) => setFormData({ ...formData, mcpServersLimit: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Alterações
        </Button>
      </DialogFooter>
    </form>
  );
} 