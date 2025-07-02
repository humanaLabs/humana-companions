'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Settings, Zap, Database, Users, MessageSquare, Server, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuotaData {
  quota: {
    monthlyMessagesLimit: number;
    dailyMessagesLimit: number;
    maxCompanions: number;
    maxCustomCompanions: number;
    maxDocuments: number;
    maxDocumentSizeMb: number;
    totalStorageMb: number;
    maxMcpServers: number;
    quotaType: string;
    usage: {
      monthlyMessagesUsed: number;
      dailyMessagesUsed: number;
      companionsCount: number;
      documentsCount: number;
      totalStorageUsedMb: number;
      mcpServersCount: number;
      messagesMonthlyPercentage: number;
      messagesDailyPercentage: number;
      companionsPercentage: number;
      documentsPercentage: number;
      storagePercentage: number;
      mcpServersPercentage: number;
    } | null;
  } | null;
  alerts: any[];
}

interface QuotasPageClientProps {
  userId: string;
}

export function QuotasPageClient({ userId }: QuotasPageClientProps) {
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    try {
      setLoading(true);
      console.log('Fazendo fetch de quotas...');
      const response = await fetch('/api/quotas');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Falha ao carregar dados de quota: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      setQuotaData(data);
      setError(null);
    } catch (error) {
      console.error('Erro no fetchQuotaData:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-full mb-4"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quotaData?.quota) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma quota configurada</h3>
          <p className="text-muted-foreground mb-4">Suas quotas serão criadas automaticamente no primeiro uso.</p>
          <Button onClick={fetchQuotaData}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  const { quota } = quotaData;
  const usage = quota.usage;

  const quotaItems = [
    {
      title: 'Mensagens Mensais',
      icon: MessageSquare,
      current: usage?.monthlyMessagesUsed || 0,
      limit: quota.monthlyMessagesLimit,
      percentage: usage?.messagesMonthlyPercentage || 0,
      description: 'Mensagens enviadas neste mês',
      color: 'blue',
    },
    {
      title: 'Mensagens Diárias',
      icon: Zap,
      current: usage?.dailyMessagesUsed || 0,
      limit: quota.dailyMessagesLimit,
      percentage: usage?.messagesDailyPercentage || 0,
      description: 'Mensagens enviadas hoje',
      color: 'green',
    },
    {
      title: 'Companions',
      icon: Users,
      current: usage?.companionsCount || 0,
      limit: quota.maxCompanions,
      percentage: usage?.companionsPercentage || 0,
      description: 'Companions ativos',
      color: 'purple',
    },
    {
      title: 'Documentos',
      icon: Database,
      current: usage?.documentsCount || 0,
      limit: quota.maxDocuments,
      percentage: usage?.documentsPercentage || 0,
      description: 'Documentos armazenados',
      color: 'orange',
    },
    {
      title: 'Armazenamento',
      icon: Database,
      current: Math.round((usage?.totalStorageUsedMb || 0) * 100) / 100,
      limit: quota.totalStorageMb,
      percentage: usage?.storagePercentage || 0,
      description: 'Storage usado (MB)',
      color: 'red',
      unit: 'MB',
    },
    {
      title: 'MCP Servers',
      icon: Server,
      current: usage?.mcpServersCount || 0,
      limit: quota.maxMcpServers,
      percentage: usage?.mcpServersPercentage || 0,
      description: 'Servidores MCP ativos',
      color: 'cyan',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header com informações gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Plano {quota.quotaType.charAt(0).toUpperCase() + quota.quotaType.slice(1)}
          </CardTitle>
          <CardDescription>
            Seu plano atual e resumo de uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              {quota.quotaType.toUpperCase()}
            </Badge>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Alertas configurados</p>
              <p className="font-medium">{quotaData.alerts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de quotas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quotaItems.map((item) => {
          const Icon = item.icon;
          const isNearLimit = item.percentage >= 80;
          const isAtLimit = item.percentage >= 100;
          
          return (
            <Card key={item.title} className={isAtLimit ? 'border-destructive' : isNearLimit ? 'border-warning' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="size-4" />
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {item.current}{item.unit && ` ${item.unit}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {item.limit}{item.unit && ` ${item.unit}`}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(item.percentage, 100)} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      isAtLimit ? 'text-destructive' : 
                      isNearLimit ? 'text-warning' : 
                      'text-muted-foreground'
                    }`}>
                      {item.percentage}% usado
                    </span>
                    {isNearLimit && (
                      <Badge variant={isAtLimit ? 'destructive' : 'secondary'} className="text-xs">
                        {isAtLimit ? 'Limite atingido' : 'Próximo ao limite'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Alertas Configurados
          </CardTitle>
          <CardDescription>
            Configure alertas para receber notificações quando se aproximar dos limites
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotaData.alerts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {quotaData.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{alert.alertType.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar aos {alert.thresholdPercentage}%
                    </p>
                  </div>
                  <Badge variant={alert.isEnabled ? 'default' : 'secondary'}>
                    {alert.isEnabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Bell className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nenhum alerta configurado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure alertas para ser notificado quando se aproximar dos limites
              </p>
              <Button variant="outline">
                Configurar Alertas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 