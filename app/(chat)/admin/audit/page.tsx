import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';

export default function AuditPage() {
  // Mock data de logs de auditoria
  const auditLogs = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      userId: 'user-1',
      userName: 'João Silva',
      action: 'USER_CREATED',
      actionName: 'Usuário Criado',
      resource: 'users',
      resourceId: 'user-5',
      details: 'Criou usuário: Carlos Ferreira',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      severity: 'info'
    },
    {
      id: '2',
      timestamp: '2024-01-15T10:25:00Z',
      userId: 'user-2',
      userName: 'Maria Santos',
      action: 'TEAM_UPDATED',
      actionName: 'Time Atualizado',
      resource: 'teams',
      resourceId: 'team-2',
      details: 'Adicionou 2 membros ao time Design',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0...',
      severity: 'info'
    },
    {
      id: '3',
      timestamp: '2024-01-15T10:20:00Z',
      userId: 'user-1',
      userName: 'João Silva',
      action: 'PERMISSION_CHANGED',
      actionName: 'Permissão Alterada',
      resource: 'users',
      resourceId: 'user-4',
      details: 'Alterou role de Ana Oliveira para TEAM_LEAD',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      severity: 'warning'
    },
    {
      id: '4',
      timestamp: '2024-01-15T10:15:00Z',
      userId: 'user-3',
      userName: 'Pedro Costa',
      action: 'COMPANION_CREATED',
      actionName: 'Companion Criado',
      resource: 'companions',
      resourceId: 'companion-8',
      details: 'Criou companion: Marketing Assistant',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0...',
      severity: 'info'
    },
    {
      id: '5',
      timestamp: '2024-01-15T10:10:00Z',
      userId: 'user-6',
      userName: 'Lucia Mendes',
      action: 'LOGIN_FAILED',
      actionName: 'Falha no Login',
      resource: 'auth',
      resourceId: null,
      details: 'Tentativa de login com credenciais inválidas',
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0...',
      severity: 'error'
    },
    {
      id: '6',
      timestamp: '2024-01-15T10:05:00Z',
      userId: 'user-1',
      userName: 'João Silva',
      action: 'ORGANIZATION_UPDATED',
      actionName: 'Organização Atualizada',
      resource: 'organizations',
      resourceId: 'org-1',
      details: 'Atualizou configurações da organização',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      severity: 'info'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    totalLogs: auditLogs.length,
    todayLogs: auditLogs.filter(log => {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length,
    errorLogs: auditLogs.filter(log => log.severity === 'error').length,
    warningLogs: auditLogs.filter(log => log.severity === 'warning').length
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur">
        <PageHeader 
          title="Auditoria e Logs" 
          description="Visualize atividades do sistema e relatórios de auditoria"
          showBackButton={true}
        >
          <div className="flex gap-2">
            <Button variant="outline">
              📊 Relatório
            </Button>
            <Button variant="outline">
              📥 Exportar
            </Button>
          </div>
        </PageHeader>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-6xl">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.totalLogs}</div>
                <div className="text-sm text-muted-foreground">Total de Logs</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.todayLogs}</div>
                <div className="text-sm text-muted-foreground">Logs Hoje</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.errorLogs}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </Card>
            <Card className="p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.warningLogs}</div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" size="sm">
              Todos
            </Button>
            <Button variant="ghost" size="sm">
              🚨 Erros ({stats.errorLogs})
            </Button>
            <Button variant="ghost" size="sm">
              ⚠️ Avisos ({stats.warningLogs})
            </Button>
            <Button variant="ghost" size="sm">
              ℹ️ Informações
            </Button>
            <Button variant="ghost" size="sm">
              👥 Usuários
            </Button>
            <Button variant="ghost" size="sm">
              🔐 Permissões
            </Button>
          </div>

          {/* Lista de Logs */}
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <Card key={log.id} className="p-4 bg-card border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{getSeverityIcon(log.severity)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{log.actionName}</h4>
                        <Badge variant={getSeverityColor(log.severity)} className="text-xs">
                          {log.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>👤 {log.userName}</span>
                        <span>🕒 {formatTimestamp(log.timestamp)}</span>
                        <span>🌐 {log.ipAddress}</span>
                        {log.resourceId && (
                          <span>📄 {log.resource}:{log.resourceId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1 flex-shrink-0">
                    ⋯
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Ações de Auditoria Mais Comuns */}
          <Card className="p-6 bg-card border rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Ações Mais Frequentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                auditLogs.reduce((acc, log) => {
                  acc[log.actionName] = (acc[log.actionName] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([action, count]) => (
                  <div key={action} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-foreground">{action}</div>
                    <div className="text-lg font-bold text-foreground">{count}</div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 