'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Settings, Database, Bot, Mail, HardDrive, Zap } from 'lucide-react';
import { toast } from 'sonner';

// Types para os providers
interface ProviderConfig {
  type: string;
  enabled: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  metadata?: {
    name: string;
    version: string;
    description?: string;
  };
}

interface ProviderHealth {
  type: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface OrganizationConfig {
  organizationId: string;
  llm?: ProviderConfig;
  storage?: ProviderConfig;
  database?: ProviderConfig;
  vector?: ProviderConfig;
  email?: ProviderConfig;
}

export default function BYOCProvidersPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [config, setConfig] = useState<OrganizationConfig>({
    organizationId: 'current-org'
  });
  const [healthStatus, setHealthStatus] = useState<Record<string, ProviderHealth>>({});
  const [availableProviders, setAvailableProviders] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadConfiguration();
    loadAvailableProviders();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/byoc-providers');
      
      if (!response.ok) {
        console.error('API Error:', response.status, await response.text());
        toast.error(`Erro ao carregar configurações: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      // 🔍 DEBUG: Log data structure
      console.log('📊 API Response:', data);
      
      // Ensure we have proper structure with fallbacks
      const llmConfig = data.configurations?.llm?.[0];
      const storageConfig = data.configurations?.storage?.[0];
      
      console.log('🔍 LLM Config:', llmConfig);
      console.log('🔍 Storage Config:', storageConfig);
      
      setConfig({
        organizationId: data.organizationId || 'current-org',
        llm: llmConfig ? {
          type: llmConfig.providerName || llmConfig.type || 'azure',
          enabled: llmConfig.enabled || false,
          credentials: llmConfig.credentials || {},
          settings: llmConfig.settings || {},
          metadata: llmConfig.metadata || {}
        } : undefined,
        storage: storageConfig ? {
          type: storageConfig.providerName || storageConfig.type || 'aws-s3',
          enabled: storageConfig.enabled || false,
          credentials: storageConfig.credentials || {},
          settings: storageConfig.settings || {},
          metadata: storageConfig.metadata || {}
        } : undefined,
        database: data.configurations?.database?.[0] ? {
          type: data.configurations.database[0].providerName || 'postgresql',
          enabled: data.configurations.database[0].enabled || false,
          credentials: data.configurations.database[0].credentials || {},
          settings: data.configurations.database[0].settings || {},
          metadata: data.configurations.database[0].metadata || {}
        } : undefined,
        vector: data.configurations?.vector?.[0] ? {
          type: data.configurations.vector[0].providerName || 'pinecone',
          enabled: data.configurations.vector[0].enabled || false,
          credentials: data.configurations.vector[0].credentials || {},
          settings: data.configurations.vector[0].settings || {},
          metadata: data.configurations.vector[0].metadata || {}
        } : undefined,
        email: data.configurations?.email?.[0] || undefined,
      });
      
      setHealthStatus(data.health || {});
    } catch (error) {
      console.error('Configuration loading error:', error);
      toast.error('Erro ao carregar configurações BYOC');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProviders = async () => {
    try {
      const response = await fetch('/api/admin/byoc-providers/available');
      const data = await response.json();
      setAvailableProviders(data);
    } catch (error) {
      console.error('Erro ao carregar providers disponíveis:', error);
    }
  };

  const testConnection = async (type: string, providerConfig: ProviderConfig) => {
    try {
      setTesting(`${type}:${providerConfig.type}`);
      
      const response = await fetch('/api/admin/byoc-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config: providerConfig })
      });

      const result = await response.json();
      
      if (result.healthy) {
        toast.success(`${type.toUpperCase()} Provider: Conexão OK (${result.responseTime}ms)`);
        setHealthStatus(prev => ({
          ...prev,
          [`${type}:${providerConfig.type}`]: {
            type,
            status: 'healthy',
            responseTime: result.responseTime
          }
        }));
      } else {
        toast.error(`${type.toUpperCase()} Provider: ${result.error}`);
        setHealthStatus(prev => ({
          ...prev,
          [`${type}:${providerConfig.type}`]: {
            type,
            status: 'unhealthy',
            error: result.error
          }
        }));
      }
    } catch (error) {
      toast.error(`Erro ao testar ${type} provider`);
    } finally {
      setTesting(null);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/byoc-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success('Configurações BYOC salvas com sucesso!');
        loadConfiguration(); // Reload para pegar health status atualizado
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações BYOC');
    } finally {
      setLoading(false);
    }
  };

  const updateProviderConfig = (type: string, updates: Partial<ProviderConfig>) => {
    setConfig(prev => {
      const currentConfig = prev[type as keyof OrganizationConfig] as ProviderConfig | undefined;
      return {
        ...prev,
        [type]: {
          ...(currentConfig || {}),
          ...updates
        } as ProviderConfig
      };
    });
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'llm': return <Bot className="h-5 w-5" />;
      case 'storage': return <HardDrive className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'vector': return <Zap className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getHealthBadge = (type: string, providerType?: string) => {
    const key = providerType ? `${type}:${providerType}` : type;
    const health = healthStatus[key];
    
    if (!health) {
      return <Badge variant="secondary">Não testado</Badge>;
    }

    switch (health.status) {
      case 'healthy':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Saudável {health.responseTime && `(${health.responseTime}ms)`}
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degradado
          </Badge>
        );
      case 'unhealthy':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
    }
  };

  if (loading && !config.organizationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações BYOC...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BYOC Providers</h1>
          <p className="text-muted-foreground">
            Configure seus próprios provedores de cloud (Bring Your Own Cloud)
          </p>
        </div>
        <Button onClick={saveConfiguration} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar Configurações
        </Button>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Configure seus próprios providers para ter controle total sobre seus dados e custos. 
          Teste cada conexão antes de salvar as configurações.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="llm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            LLM
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="vector" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Vector
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* LLM Providers */}
        <TabsContent value="llm">
          <LLMProviderConfig
            config={config.llm}
            availableProviders={availableProviders.llm || []}
            onUpdate={(updates) => updateProviderConfig('llm', updates)}
            onTest={(providerConfig) => testConnection('llm', providerConfig)}
            testing={testing === `llm:${config.llm?.type}`}
            health={getHealthBadge('llm', config.llm?.type)}
          />
        </TabsContent>

        {/* Storage Providers */}
        <TabsContent value="storage">
          <StorageProviderConfig
            config={config.storage}
            availableProviders={availableProviders.storage || []}
            onUpdate={(updates) => updateProviderConfig('storage', updates)}
            onTest={(providerConfig) => testConnection('storage', providerConfig)}
            testing={testing === `storage:${config.storage?.type}`}
            health={getHealthBadge('storage', config.storage?.type)}
          />
        </TabsContent>

        {/* Database Providers */}
        <TabsContent value="database">
          <DatabaseProviderConfig
            config={config.database}
            availableProviders={availableProviders.database || []}
            onUpdate={(updates) => updateProviderConfig('database', updates)}
            onTest={(providerConfig) => testConnection('database', providerConfig)}
            testing={testing === `database:${config.database?.type}`}
            health={getHealthBadge('database', config.database?.type)}
          />
        </TabsContent>

        {/* Vector Providers */}
        <TabsContent value="vector">
          <VectorProviderConfig
            config={config.vector}
            availableProviders={availableProviders.vector || []}
            onUpdate={(updates) => updateProviderConfig('vector', updates)}
            onTest={(providerConfig) => testConnection('vector', providerConfig)}
            testing={testing === `vector:${config.vector?.type}`}
            health={getHealthBadge('vector', config.vector?.type)}
          />
        </TabsContent>

        {/* Email Providers */}
        <TabsContent value="email">
          <EmailProviderConfig
            config={config.email}
            availableProviders={availableProviders.email || []}
            onUpdate={(updates) => updateProviderConfig('email', updates)}
            onTest={(providerConfig) => testConnection('email', providerConfig)}
            testing={testing === `email:${config.email?.type}`}
            health={getHealthBadge('email', config.email?.type)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// LLM Provider Configuration Component
function LLMProviderConfig({ config, availableProviders, onUpdate, onTest, testing, health }: {
  config?: ProviderConfig;
  availableProviders: string[];
  onUpdate: (updates: Partial<ProviderConfig>) => void;
  onTest: (config: ProviderConfig) => void;
  testing: boolean;
  health: React.ReactNode;
}) {
  const currentConfig = config || {
    type: '',
    enabled: false,
    credentials: {},
    settings: {}
  };

  const renderCredentialsForm = () => {
    switch (currentConfig.type) {
      case 'openai':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="openai-api-key">API Key</Label>
              <Input
                id="openai-api-key"
                type="password"
                value={currentConfig.credentials.apiKey || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, apiKey: e.target.value }
                })}
                placeholder="sk-..."
              />
            </div>
            <div>
              <Label htmlFor="openai-organization">Organization ID (opcional)</Label>
              <Input
                id="openai-organization"
                value={currentConfig.credentials.organization || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, organization: e.target.value }
                })}
                placeholder="org-..."
              />
            </div>
            <div>
              <Label htmlFor="openai-model">Modelo Padrão</Label>
              <Select
                value={currentConfig.credentials.defaultModel || 'gpt-4'}
                onValueChange={(value) => onUpdate({
                  credentials: { ...currentConfig.credentials, defaultModel: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'azure-openai':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="azure-api-key">API Key</Label>
              <Input
                id="azure-api-key"
                type="password"
                value={currentConfig.credentials.apiKey || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, apiKey: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="azure-endpoint">Endpoint</Label>
              <Input
                id="azure-endpoint"
                value={currentConfig.credentials.endpoint || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, endpoint: e.target.value }
                })}
                placeholder="https://your-resource.openai.azure.com"
              />
            </div>
            <div>
              <Label htmlFor="azure-deployment">Deployment Name</Label>
              <Input
                id="azure-deployment"
                value={currentConfig.credentials.deploymentName || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, deploymentName: e.target.value }
                })}
                placeholder="gpt-4-deployment"
              />
            </div>
            <div>
              <Label htmlFor="azure-api-version">API Version</Label>
              <Input
                id="azure-api-version"
                value={currentConfig.credentials.apiVersion || '2023-12-01-preview'}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, apiVersion: e.target.value }
                })}
              />
            </div>
          </div>
        );

      default:
        return (
          <Alert>
            <AlertDescription>
              Selecione um provider para configurar as credenciais.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              LLM Provider
            </CardTitle>
            <CardDescription>
              Configure seu provedor de modelos de linguagem
            </CardDescription>
          </div>
          {health}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={currentConfig.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
          <Label>Ativar LLM Provider customizado</Label>
        </div>

        {currentConfig.enabled && (
          <>
            <Separator />
            <div>
              <Label htmlFor="llm-provider">Provider</Label>
              <Select
                value={currentConfig.type}
                onValueChange={(type) => onUpdate({ type, credentials: {} })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um provider" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider === 'openai' ? 'OpenAI' : 
                       provider === 'azure-openai' ? 'Azure OpenAI' : provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentConfig.type && (
              <>
                <Separator />
                {renderCredentialsForm()}
              </>
            )}
          </>
        )}
      </CardContent>
      {currentConfig.enabled && currentConfig.type && (
        <CardFooter>
          <Button
            onClick={() => onTest(currentConfig)}
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testando Conexão...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Storage Provider Configuration Component
function StorageProviderConfig({ config, availableProviders, onUpdate, onTest, testing, health }: {
  config?: ProviderConfig;
  availableProviders: string[];
  onUpdate: (updates: Partial<ProviderConfig>) => void;
  onTest: (config: ProviderConfig) => void;
  testing: boolean;
  health: React.ReactNode;
}) {
  const currentConfig = config || {
    type: '',
    enabled: false,
    credentials: {},
    settings: {}
  };

  const renderCredentialsForm = () => {
    switch (currentConfig.type) {
      case 'vercel-blob':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vercel-token">Vercel Blob Token</Label>
              <Input
                id="vercel-token"
                type="password"
                value={currentConfig.credentials.token || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, token: e.target.value }
                })}
                placeholder="vercel_blob_rw_..."
              />
            </div>
          </div>
        );

      case 'aws-s3':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aws-access-key">Access Key ID</Label>
              <Input
                id="aws-access-key"
                type="password"
                value={currentConfig.credentials.accessKeyId || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, accessKeyId: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="aws-secret-key">Secret Access Key</Label>
              <Input
                id="aws-secret-key"
                type="password"
                value={currentConfig.credentials.secretAccessKey || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, secretAccessKey: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="aws-region">Region</Label>
              <Select
                value={currentConfig.credentials.region || ''}
                onValueChange={(region) => onUpdate({
                  credentials: { ...currentConfig.credentials, region }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                  <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="aws-bucket">Bucket Name</Label>
              <Input
                id="aws-bucket"
                value={currentConfig.credentials.bucketName || ''}
                onChange={(e) => onUpdate({
                  credentials: { ...currentConfig.credentials, bucketName: e.target.value }
                })}
                placeholder="my-storage-bucket"
              />
            </div>
          </div>
        );

      default:
        return (
          <Alert>
            <AlertDescription>
              Selecione um provider para configurar as credenciais.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Provider
            </CardTitle>
            <CardDescription>
              Configure seu provedor de armazenamento de arquivos
            </CardDescription>
          </div>
          {health}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={currentConfig.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
          <Label>Ativar Storage Provider customizado</Label>
        </div>

        {currentConfig.enabled && (
          <>
            <Separator />
            <div>
              <Label htmlFor="storage-provider">Provider</Label>
              <Select
                value={currentConfig.type}
                onValueChange={(type) => onUpdate({ type, credentials: {} })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um provider" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider === 'vercel-blob' ? 'Vercel Blob' : 
                       provider === 'aws-s3' ? 'AWS S3' : provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentConfig.type && (
              <>
                <Separator />
                {renderCredentialsForm()}
              </>
            )}
          </>
        )}
      </CardContent>
      {currentConfig.enabled && currentConfig.type && (
        <CardFooter>
          <Button
            onClick={() => onTest(currentConfig)}
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testando Conexão...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Placeholder components para outros providers
function DatabaseProviderConfig({ config, availableProviders, onUpdate, onTest, testing, health }: {
  config?: ProviderConfig;
  availableProviders: string[];
  onUpdate: (updates: Partial<ProviderConfig>) => void;
  onTest: (config: ProviderConfig) => void;
  testing: boolean;
  health: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Provider
        </CardTitle>
        <CardDescription>Em desenvolvimento...</CardDescription>
      </CardHeader>
    </Card>
  );
}

function VectorProviderConfig({ config, availableProviders, onUpdate, onTest, testing, health }: {
  config?: ProviderConfig;
  availableProviders: string[];
  onUpdate: (updates: Partial<ProviderConfig>) => void;
  onTest: (config: ProviderConfig) => void;
  testing: boolean;
  health: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Vector Provider
        </CardTitle>
        <CardDescription>Em desenvolvimento...</CardDescription>
      </CardHeader>
    </Card>
  );
}

function EmailProviderConfig({ config, availableProviders, onUpdate, onTest, testing, health }: {
  config?: ProviderConfig;
  availableProviders: string[];
  onUpdate: (updates: Partial<ProviderConfig>) => void;
  onTest: (config: ProviderConfig) => void;
  testing: boolean;
  health: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Provider
        </CardTitle>
        <CardDescription>Em desenvolvimento...</CardDescription>
      </CardHeader>
    </Card>
  );
} 