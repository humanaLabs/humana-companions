# Webhook & Events System - Real-time Integration

## 🎯 Visão Geral

Sistema completo de webhooks e eventos em tempo real que permite aos clientes receber notificações instantâneas sobre qualquer atividade dos companions.

## 🔔 Tipos de Eventos

### **Companion Events**
- `companion.created` - Novo companion criado
- `companion.updated` - Companion modificado
- `companion.deleted` - Companion removido
- `companion.activated` - Companion ativado
- `companion.deactivated` - Companion desativado

### **Chat Events**
- `message.sent` - Mensagem enviada pelo usuário
- `message.received` - Resposta do companion
- `chat.started` - Nova sessão iniciada
- `chat.ended` - Sessão finalizada
- `stream.started` - Streaming iniciado
- `stream.chunk` - Chunk de streaming

### **System Events**
- `error.occurred` - Erro no sistema
- `quota.warning` - Quota próxima do limite
- `quota.exceeded` - Quota excedida
- `performance.degraded` - Performance degradada

## 🎣 Webhook Configuration

### **Setup via API**
```typescript
POST /api/v1/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["message.sent", "message.received"],
  "secret": "your-secret",
  "filters": {
    "companionId": ["comp-123"]
  }
}
```

### **Verification**
```javascript
// HMAC-SHA256 signature verification
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## 🌊 Server-Sent Events (SSE)

### **Connection**
```typescript
GET /api/v1/events/stream
Headers:
  Authorization: Bearer your-api-key
  Accept: text/event-stream
```

### **Client Implementation**
```javascript
const eventSource = new EventSource('/api/v1/events/stream', {
  headers: { 'Authorization': 'Bearer your-api-key' }
})

eventSource.addEventListener('message.sent', (event) => {
  const data = JSON.parse(event.data)
  console.log('New message:', data.content)
})
```

## 🔌 WebSocket Integration

### **Connection**
```typescript
WS /api/v1/ws?companions=comp-123
Headers:
  Authorization: Bearer your-api-key
```

### **Message Protocol**
```javascript
// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: {
    events: ['message.sent', 'message.received']
  }
}))

// Receive events
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'event') {
    console.log('Event:', message.payload)
  }
}
```

## 🎯 Integration Use Cases

### **Mobile App Sync**
- Push notifications para usuários offline
- Sync em tempo real para usuários ativos
- Queue offline para confiabilidade

### **Chat Interface Integration**
- Receber mensagens dos companions
- Enviar mensagens para companions
- Sincronização bidirecional

### **Analytics Dashboard**
- Métricas em tempo real
- Alertas automáticos
- Dashboards dinâmicos

### **Notification System**
- Email para erros críticos
- Slack para alertas
- PagerDuty para emergências

## 📊 Monitoring & Observability

### **Health Checks**
```typescript
GET /api/v1/events/health
{
  "status": "healthy",
  "checks": {
    "webhook_processor": "healthy",
    "sse_server": "healthy",
    "websocket_server": "healthy"
  },
  "metrics": {
    "active_webhooks": 1250,
    "active_connections": 107,
    "pending_events": 5
  }
}
```

### **Event Debugging**
```typescript
// Debug webhook delivery
GET /api/v1/webhooks/{id}/deliveries

// Replay failed webhook
POST /api/v1/webhooks/{id}/deliveries/{deliveryId}/replay
```

## 🚀 Implementation Roadmap

### **Phase 1: Core System (Months 1-2)**
- [ ] Event schema design
- [ ] Webhook processor
- [ ] Basic retry logic
- [ ] Signature verification
- [ ] Management API

### **Phase 2: Real-time Streaming (Months 3-4)**
- [ ] Server-Sent Events
- [ ] WebSocket gateway
- [ ] Connection management
- [ ] Event filtering
- [ ] Load balancing

### **Phase 3: Advanced Features (Months 5-6)**
- [ ] Dead letter queue
- [ ] Event replay
- [ ] Batch delivery
- [ ] Custom transformations
- [ ] Analytics integration

### **Phase 4: Enterprise Features (Months 7-8)**
- [ ] SLA guarantees
- [ ] Compliance logging
- [ ] Multi-region support
- [ ] Custom protocols
- [ ] Enterprise security

## 🎯 Business Impact

### **Value Proposition**
- **Real-time Sync**: Eliminação de lag entre sistemas
- **Automation**: Workflows automáticos baseados em eventos
- **Reliability**: 99.9% garantia de delivery
- **Scalability**: Suporte a milhares de eventos/segundo

### **Success Metrics**
- **Event Delivery Rate**: >99.9%
- **Latency**: <100ms p95
- **Throughput**: 10,000+ events/second
- **Customer Satisfaction**: NPS >8/10

---

**Sistema de webhooks e eventos essencial para interoperabilidade total, permitindo sincronização e automação baseada na inteligência dos companions.** 