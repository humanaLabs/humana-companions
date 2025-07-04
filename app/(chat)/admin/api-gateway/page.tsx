import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Globe, Zap, Key, Code, ExternalLink, AlertCircle, Activity } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ApiGatewayPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Gateway & Interoperabilidade</h1>
          <p className="text-muted-foreground mt-1">
            Transforme seus Companions em serviços API universais para qualquer sistema
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ROADMAP 2025
        </Badge>
      </div>

      {/* Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Funcionalidade Futura:</strong> API Gateway será implementado 6-12 meses após a foundation.
          Estratégia "Companions as a Service" em desenvolvimento.
        </AlertDescription>
      </Alert>

      {/* API Gateway Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* REST API */}
        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <CardTitle>REST API Gateway</CardTitle>
              <Badge variant="outline">Core</Badge>
            </div>
            <CardDescription>
              APIs RESTful completas para integração com qualquer sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Endpoints:</span>
                <span>100+ endpoints</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Rate Limiting:</span>
                <span>Configurável</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Authentication:</span>
                <span>JWT, OAuth2, API Keys</span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Casos de Uso:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CRM Integration (Salesforce)</li>
                <li>• E-commerce product advisors</li>
                <li>• Custom dashboards</li>
                <li>• Mobile apps</li>
              </ul>
            </div>

            <Button disabled className="w-full">
              Configurar REST API
            </Button>
          </CardContent>
        </Card>

        {/* GraphQL API */}
        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-500" />
              <CardTitle>GraphQL API</CardTitle>
              <Badge variant="outline">Advanced</Badge>
            </div>
            <CardDescription>
              API GraphQL flexível para consultas complexas e eficientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Schema:</span>
                <span>Type-safe, auto-generated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Queries:</span>
                <span>Nested, optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Subscriptions:</span>
                <span>Real-time updates</span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Casos de Uso:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complex data relationships</li>
                <li>• Real-time dashboards</li>
                <li>• Advanced analytics</li>
                <li>• Developer tools</li>
              </ul>
            </div>

            <Button disabled className="w-full">
              Configurar GraphQL
            </Button>
          </CardContent>
        </Card>

        {/* OpenAI Compatible */}
        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <CardTitle>OpenAI Compatible</CardTitle>
              <Badge variant="outline">Premium</Badge>
            </div>
            <CardDescription>
              API 100% compatível com OpenAI para integração instantânea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Compatibility:</span>
                <span>OpenAI SDK compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Endpoints:</span>
                <span>/v1/chat/completions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Streaming:</span>
                <span>SSE support</span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Casos de Uso:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Drop-in replacement</li>
                <li>• Legacy system integration</li>
                <li>• Third-party tools</li>
                <li>• AI frameworks</li>
              </ul>
            </div>

            <Button disabled className="w-full">
              Configurar OpenAI API
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recursos Real-time
          </CardTitle>
          <CardDescription>
            Integração em tempo real com WebSocket, SSE e Webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge variant="outline">WebSocket</Badge>
              <div className="text-sm">
                <div className="font-medium">Bi-directional Communication</div>
                <div className="text-muted-foreground">Real-time chat, notifications</div>
              </div>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Server-Sent Events</Badge>
              <div className="text-sm">
                <div className="font-medium">Streaming Updates</div>
                <div className="text-muted-foreground">Live status, progress tracking</div>
              </div>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Webhooks</Badge>
              <div className="text-sm">
                <div className="font-medium">Event-driven Integration</div>
                <div className="text-muted-foreground">Automated workflows</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Development */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            SDK Multi-linguagem
          </CardTitle>
          <CardDescription>
            SDKs prontos para usar em todas as linguagens populares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="font-medium">JavaScript/TypeScript</div>
              <div className="text-sm text-muted-foreground">NPM package</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="font-medium">Python</div>
              <div className="text-sm text-muted-foreground">PyPI package</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="font-medium">Java</div>
              <div className="text-sm text-muted-foreground">Maven/Gradle</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="font-medium">PHP</div>
              <div className="text-sm text-muted-foreground">Composer package</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Gateway Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração do Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Segurança & Autenticação</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>API Keys Management</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>OAuth2 Integration</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rate Limiting</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>IP Whitelisting</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Monitoramento & Analytics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Request Analytics</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Tracking</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Performance Metrics</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Custom Dashboards</span>
                  <Badge variant="outline">Planejado</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Revenue Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              $100k+ MRR através de APIs premium e $500k+ ARR em professional services
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Network Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ecosystem de desenvolvedores acelera adoção e cria vendor lock-in positivo
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Market Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Única plataforma API-first para AI companions - category leadership
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Implementação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Badge variant="outline">Fase 1 (Meses 1-3)</Badge>
                <div className="text-sm">
                  <div className="font-medium">REST API Foundation</div>
                  <div className="text-muted-foreground">Core endpoints + authentication</div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Fase 2 (Meses 4-6)</Badge>
                <div className="text-sm">
                  <div className="font-medium">GraphQL & OpenAI</div>
                  <div className="text-muted-foreground">Advanced APIs + compatibility</div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Fase 3 (Meses 7-9)</Badge>
                <div className="text-sm">
                  <div className="font-medium">Real-time & SDKs</div>
                  <div className="text-muted-foreground">WebSocket, SSE, multi-lang SDKs</div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Fase 4 (Meses 10-12)</Badge>
                <div className="text-sm">
                  <div className="font-medium">Enterprise Features</div>
                  <div className="text-muted-foreground">Advanced security, analytics</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação Técnica</CardTitle>
          <CardDescription>
            Acesse a documentação completa do planejamento de APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/projeto/features/05-integration/api-first-architecture.md" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                API-First Architecture
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/projeto/features/05-integration/sdk-development.md" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                SDK Development Strategy
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 