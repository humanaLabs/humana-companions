# Webhook & Events System - Real-time Integration

## 🎯 Visão Geral

**"Real-time Everything"** - Sistema completo de webhooks e eventos em tempo real que permite aos clientes receber notificações instantâneas sobre qualquer atividade dos companions, mantendo seus sistemas sempre sincronizados.

### **🚀 Proposta de Valor**
- **Sincronização Instantânea**: Sistemas externos sempre atualizados
- **Automação Avançada**: Triggers automáticos baseados em eventos
- **Auditoria Completa**: Rastreamento de todas as ações em tempo real
- **Escalabilidade**: Suporte a milhares de eventos por segundo
- **Confiabilidade**: Garantia de entrega com retry automático

---

## 🔔 Event-Driven Architecture

### **📊 Tipos de Eventos**

#### **🤖 Companion Events**
```typescript
interface CompanionEvents {
  // Lifecycle events
  'companion.created': {
    companionId: string
    name: string
    organizationId: string
    config: CompanionConfig
    createdBy: string
    timestamp: string
  }
  
  'companion.updated': {
    companionId: string
    changes: Partial<CompanionConfig>
    updatedBy: string
    timestamp: string
  }
  
  'companion.deleted': {
    companionId: string
    name: string
    deletedBy: string
    timestamp: string
  }
  
  // Status events
  'companion.activated': {
    companionId: string
    previousStatus: string
    timestamp: string
  }
  
  'companion.deactivated': {
    companionId: string
    reason: string
    timestamp: string
  }
}
```

#### **💬 Chat Events**
```typescript
interface ChatEvents {
  // Message events
  'message.sent': {
    messageId: string
    companionId: string
    userId: string
    content: string
    type: 'text' | 'image' | 'file' | 'structured'
    timestamp: string
    metadata: MessageMetadata
  }
  
  'message.received': {
    messageId: string
    companionId: string
    userId: string
    response: string
    processingTime: number
    tokensUsed: number
    timestamp: string
  }
  
  // Session events
  'chat.started': {
    sessionId: string
    companionId: string
    userId: string
    context: ChatContext
    timestamp: string
  }
  
  'chat.ended': {
    sessionId: string
    companionId: string
    userId: string
    duration: number
    messageCount: number
    timestamp: string
  }
  
  // Streaming events
  'stream.started': {
    streamId: string
    companionId: string
    userId: string
    timestamp: string
  }
  
  'stream.chunk': {
    streamId: string
    chunkId: string
    content: string
    isComplete: boolean
    timestamp: string
  }
}
```

#### **🔧 System Events**
```typescript
interface SystemEvents {
  // Error events
  'error.occurred': {
    errorId: string
    type: 'validation' | 'processing' | 'integration' | 'rate_limit'
    message: string
    companionId?: string
    userId?: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: string
  }
  
  // Performance events
  'performance.degraded': {
    service: string
    metric: string
    value: number
    threshold: number
    timestamp: string
  }
  
  // Usage events
  'quota.warning': {
    organizationId: string
    metric: string
    current: number
    limit: number
    percentage: number
    timestamp: string
  }
  
  'quota.exceeded': {
    organizationId: string
    metric: string
    limit: number
    action: 'throttled' | 'blocked'
    timestamp: string
  }
}
```

#### **📊 Analytics Events**
```typescript
interface AnalyticsEvents {
  // Usage tracking
  'usage.recorded': {
    organizationId: string
    companionId: string
    userId: string
    action: string
    duration: number
    resources: ResourceUsage
    timestamp: string
  }
  
  // Performance metrics
  'metrics.collected': {
    organizationId: string
    companionId: string
    metrics: {
      responseTime: number
      throughput: number
      errorRate: number
      satisfactionScore?: number
    }
    timestamp: string
  }
  
  // Business intelligence
  'insight.generated': {
    organizationId: string
    type: 'trend' | 'anomaly' | 'recommendation'
    data: InsightData
    confidence: number
    timestamp: string
  }
}
```

---

## 🎣 Webhook Configuration

### **🔧 Webhook Setup**

#### **Management API**
```typescript
// Create webhook endpoint
POST /api/v1/webhooks
{
  "url": "https://your-app.com/humana/webhook",
  "events": [
    "companion.created",
    "companion.updated",
    "message.sent",
    "message.received"
  ],
  "secret": "your-webhook-secret",
  "headers": {
    "X-Custom-Header": "value"
  },
  "filters": {
    "companionId": ["comp-123", "comp-456"],
    "userId": ["user-*"]
  },
  "retry": {
    "maxAttempts": 3,
    "backoffMultiplier": 2,
    "maxDelay": 300
  }
}

// List webhooks
GET /api/v1/webhooks

// Update webhook
PUT /api/v1/webhooks/{id}

// Delete webhook
DELETE /api/v1/webhooks/{id}

// Test webhook
POST /api/v1/webhooks/{id}/test
```

#### **Webhook Verification**
```typescript
// Signature verification
interface WebhookSecurity {
  // HMAC-SHA256 signature
  signature: string  // X-Humana-Signature header
  
  // Timestamp for replay protection
  timestamp: string  // X-Humana-Timestamp header
  
  // Verification logic
  verifySignature(payload: string, signature: string, secret: string): boolean
  
  // Replay protection (5 minute window)
  verifyTimestamp(timestamp: string): boolean
}

// Example verification (Node.js)
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret, timestamp) {
  // Verify timestamp (replay protection)
  const now = Math.floor(Date.now() / 1000)
  const receivedTime = parseInt(timestamp)
  if (Math.abs(now - receivedTime) > 300) {
    return false // Reject old requests
  }
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}
```

### **🔄 Retry & Reliability**

#### **Retry Strategy**
```typescript
interface RetryConfig {
  maxAttempts: number        // 3 attempts default
  backoffMultiplier: number  // 2x backoff default
  maxDelay: number          // 5 minutes max
  
  // Retry schedule example:
  // Attempt 1: immediate
  // Attempt 2: 2 seconds
  // Attempt 3: 4 seconds
  // Attempt 4: 8 seconds (if maxAttempts = 4)
}

// Response codes that trigger retry
const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504  // Gateway Timeout
]

// Success codes (no retry)
const SUCCESS_STATUS_CODES = [200, 201, 202, 204]
```

#### **Dead Letter Queue**
```typescript
// Failed webhook handling
interface DeadLetterQueue {
  // Store failed webhooks
  store(webhook: FailedWebhook): void
  
  // Retry failed webhooks
  retry(webhookId: string): void
  
  // Manual inspection
  list(filters: DLQFilters): FailedWebhook[]
  
  // Cleanup
  purge(olderThan: Date): void
}

interface FailedWebhook {
  id: string
  originalWebhook: WebhookConfig
  event: EventPayload
  attempts: RetryAttempt[]
  failureReason: string
  createdAt: string
  lastAttempt: string
}
```

---

## 🌊 Server-Sent Events (SSE)

### **📡 Real-time Streaming**

#### **SSE Connection**
```typescript
// Connect to event stream
GET /api/v1/events/stream
Headers:
  Authorization: Bearer your-api-key
  Accept: text/event-stream
  Cache-Control: no-cache

Query Parameters:
  ?companions=comp-123,comp-456    // Filter by companion IDs
  ?events=message.sent,message.received  // Filter by event types
  ?userId=user-123                 // Filter by user
  ?organizationId=org-456         // Filter by organization
```

#### **Event Stream Format**
```typescript
// SSE message format
event: message.sent
id: evt_123456789
data: {
  "messageId": "msg-abc123",
  "companionId": "comp-456",
  "userId": "user-789",
  "content": "Hello, how can I help you?",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "processingTime": 150,
    "tokensUsed": 25
  }
}

event: heartbeat
id: evt_123456790
data: {"timestamp": "2024-01-15T10:30:30Z"}
```

#### **Client Implementation Examples**

**JavaScript/Browser**
```javascript
const eventSource = new EventSource('/api/v1/events/stream?companions=comp-123', {
  headers: {
    'Authorization': 'Bearer your-api-key'
  }
})

eventSource.addEventListener('message.sent', (event) => {
  const data = JSON.parse(event.data)
  console.log('New message:', data.content)
})

eventSource.addEventListener('error', (event) => {
  console.error('SSE error:', event)
})
```

**Node.js**
```javascript
const EventSource = require('eventsource')

const eventSource = new EventSource('https://api.humana.ai/v1/events/stream', {
  headers: {
    'Authorization': 'Bearer your-api-key'
  }
})

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Process event
}
```

**Python**
```python
import sseclient
import requests

headers = {'Authorization': 'Bearer your-api-key'}
response = requests.get('https://api.humana.ai/v1/events/stream', 
                       headers=headers, stream=True)

client = sseclient.SSEClient(response)
for event in client.events():
    data = json.loads(event.data)
    # Process event
```

---

## 🔌 WebSocket Integration

### **⚡ Real-time Bidirectional Communication**

#### **WebSocket Connection**
```typescript
// Connect to WebSocket
WS /api/v1/ws
Headers:
  Authorization: Bearer your-api-key
  
Query Parameters:
  ?companions=comp-123,comp-456
  ?events=message.sent,message.received
  ?userId=user-123
```

#### **Message Protocol**
```typescript
// Client to server messages
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'chat'
  requestId: string
  payload: any
}

// Server to client messages
interface ServerMessage {
  type: 'event' | 'ack' | 'error' | 'pong'
  requestId?: string
  payload: any
}

// Examples
// Subscribe to events
{
  "type": "subscribe",
  "requestId": "req-123",
  "payload": {
    "events": ["message.sent", "message.received"],
    "companions": ["comp-123"]
  }
}

// Event notification
{
  "type": "event",
  "payload": {
    "eventType": "message.sent",
    "data": {
      "messageId": "msg-456",
      "content": "Hello",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### **WebSocket Client Examples**

**JavaScript**
```javascript
const ws = new WebSocket('wss://api.humana.ai/v1/ws?companions=comp-123')

ws.onopen = () => {
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'subscribe',
    requestId: 'req-123',
    payload: {
      events: ['message.sent', 'message.received']
    }
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'event') {
    console.log('Event received:', message.payload)
  }
}
```

**Python**
```python
import asyncio
import websockets
import json

async def listen_events():
    uri = "wss://api.humana.ai/v1/ws?companions=comp-123"
    headers = {"Authorization": "Bearer your-api-key"}
    
    async with websockets.connect(uri, extra_headers=headers) as websocket:
        # Subscribe to events
        await websocket.send(json.dumps({
            "type": "subscribe",
            "requestId": "req-123",
            "payload": {
                "events": ["message.sent", "message.received"]
            }
        }))
        
        async for message in websocket:
            data = json.loads(message)
            if data["type"] == "event":
                print(f"Event: {data['payload']}")

asyncio.run(listen_events())
```

---

## 🎯 Integration Use Cases

### **📱 Mobile App Sync**
```typescript
// Mobile app receiving real-time updates
interface MobileAppIntegration {
  // Push notifications for offline users
  webhook: 'https://your-app.com/push-notification'
  events: ['message.sent', 'companion.updated']
  
  // Real-time sync for active users
  webSocket: 'wss://your-app.com/sync'
  
  // Offline queue for reliability
  offlineQueue: {
    maxSize: 1000
    retention: '7 days'
  }
}
```

### **🎮 Chat Interface Integration**
```typescript
// Third-party chat interface
interface ChatIntegration {
  // Receive messages from Humana
  webhook: {
    url: 'https://chat-platform.com/humana/webhook'
    events: ['message.received']
    transform: (event) => ({
      chatId: event.sessionId,
      message: event.response,
      sender: event.companionId
    })
  }
  
  // Send messages to Humana
  api: {
    endpoint: 'https://api.humana.ai/v1/companions/{id}/chat'
    method: 'POST'
  }
}
```

### **📊 Analytics Dashboard**
```typescript
// Real-time analytics dashboard
interface AnalyticsDashboard {
  sse: {
    url: 'https://api.humana.ai/v1/events/stream'
    events: ['usage.recorded', 'metrics.collected']
    filters: {
      organizationId: 'org-123'
    }
  }
  
  // Aggregate metrics in real-time
  aggregation: {
    window: '1 minute'
    metrics: ['messageCount', 'responseTime', 'errorRate']
  }
}
```

### **🔔 Notification System**
```typescript
// Multi-channel notification system
interface NotificationSystem {
  channels: {
    email: {
      events: ['error.occurred', 'quota.exceeded']
      threshold: 'medium'
    }
    slack: {
      events: ['performance.degraded', 'quota.warning']
      webhook: 'https://hooks.slack.com/services/...'
    }
    pagerduty: {
      events: ['error.occurred']
      severity: 'critical'
    }
  }
}
```

---

## 📊 Monitoring & Observability

### **📈 Event Metrics**

#### **Delivery Metrics**
```typescript
interface EventMetrics {
  // Delivery success rate
  deliveryRate: {
    successful: number
    failed: number
    percentage: number
  }
  
  // Latency metrics
  latency: {
    p50: number
    p95: number
    p99: number
    average: number
  }
  
  // Throughput
  throughput: {
    eventsPerSecond: number
    peakThroughput: number
    averageThroughput: number
  }
  
  // Error tracking
  errors: {
    byType: Record<string, number>
    byStatusCode: Record<number, number>
    retrySuccess: number
  }
}
```

#### **Health Checks**
```typescript
// Event system health endpoints
GET /api/v1/events/health
{
  "status": "healthy",
  "checks": {
    "webhook_processor": "healthy",
    "sse_server": "healthy",
    "websocket_server": "healthy",
    "dead_letter_queue": "healthy"
  },
  "metrics": {
    "active_webhooks": 1250,
    "active_sse_connections": 75,
    "active_websocket_connections": 32,
    "pending_events": 5
  }
}
```

### **🔍 Event Debugging**

#### **Event Inspector**
```typescript
// Debug webhook delivery
GET /api/v1/webhooks/{id}/deliveries
{
  "deliveries": [
    {
      "id": "del-123",
      "event": "message.sent",
      "url": "https://your-app.com/webhook",
      "status": "success",
      "statusCode": 200,
      "duration": 245,
      "attempts": 1,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}

// Replay failed webhook
POST /api/v1/webhooks/{id}/deliveries/{deliveryId}/replay
```

#### **Event Logs**
```typescript
// Query event history
GET /api/v1/events/history
Query Parameters:
  ?eventType=message.sent
  &companionId=comp-123
  &from=2024-01-15T00:00:00Z
  &to=2024-01-15T23:59:59Z
  &limit=100
```

---

## 🚀 Implementation Roadmap

### **📅 Phase 1: Core Event System (Months 1-2)**
- [ ] **Event Schema Design** - Definir todos os tipos de eventos
- [ ] **Event Publisher** - Sistema para publicar eventos
- [ ] **Webhook Processor** - Delivery confiável de webhooks
- [ ] **Basic Retry Logic** - Estratégias de retry
- [ ] **Signature Verification** - Segurança de webhooks
- [ ] **Management API** - CRUD para webhooks

### **📅 Phase 2: Real-time Streaming (Months 3-4)**
- [ ] **Server-Sent Events** - Streaming de eventos
- [ ] **WebSocket Gateway** - Comunicação bidirecional
- [ ] **Connection Management** - Gestão de conexões
- [ ] **Event Filtering** - Filtros avançados
- [ ] **Load Balancing** - Distribuição de carga
- [ ] **Monitoring Dashboard** - Observabilidade

### **📅 Phase 3: Advanced Features (Months 5-6)**
- [ ] **Dead Letter Queue** - Gestão de falhas
- [ ] **Event Replay** - Reprocessamento de eventos
- [ ] **Batch Delivery** - Entrega em lotes
- [ ] **Custom Transformations** - Transformações de payload
- [ ] **A/B Testing** - Testes de delivery
- [ ] **Analytics Integration** - Métricas avançadas

### **📅 Phase 4: Enterprise Features (Months 7-8)**
- [ ] **SLA Guarantees** - Garantias de delivery
- [ ] **Compliance Logging** - Logs de auditoria
- [ ] **Multi-region Support** - Distribuição global
- [ ] **Custom Protocols** - Protocolos personalizados
- [ ] **Enterprise Security** - Recursos de segurança
- [ ] **Professional Services** - Suporte especializado

---

## 🎯 Business Impact

### **💰 Value Proposition**
- **Real-time Sync**: Eliminação de lag entre sistemas
- **Automation**: Workflows automáticos baseados em eventos
- **Reliability**: 99.9% garantia de delivery
- **Scalability**: Suporte a milhares de eventos/segundo
- **Developer Experience**: Integração simples e poderosa

### **📊 Success Metrics**
- **Event Delivery Rate**: >99.9%
- **Latency**: <100ms p95
- **Throughput**: 10,000+ events/second
- **Customer Satisfaction**: NPS >8/10
- **Integration Time**: <30 minutes average

---

**O sistema de webhooks e eventos em tempo real é fundamental para criar uma plataforma verdadeiramente interoperável, permitindo que os clientes mantenham seus sistemas sincronizados e automatizem workflows complexos baseados na inteligência dos companions.** 