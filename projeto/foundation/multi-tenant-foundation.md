# 🏗️ Multi-Tenant Architecture Foundation

**Status**: 🔴 **P0B - Critical Security**  
**Timeline**: 1-2 semanas implementação  
**Risk**: GDPR/LGPD violations + Data leakage  

## 🚨 **Critical Issue Identified**

### **Current Multi-Tenancy is INCONSISTENT**
```sql
-- ❌ PROBLEMA CRÍTICO (User-scoped apenas)
Chat: { userId, /* NO organizationId */ }
Document: { userId, /* NO organizationId */ }
McpServer: { userId, /* NO organizationId */ }
ProjectFolder: { userId, /* NO organizationId */ }

-- ✅ SOLUÇÃO NECESSÁRIA (Org-scoped)
Chat: { userId, organizationId }
Document: { userId, organizationId }
McpServer: { userId, organizationId }
ProjectFolder: { userId, organizationId }
```

### **Security Risk Assessment**
- **Cross-tenant Data Leakage**: CRITICAL - Dados podem vazar entre organizações
- **GDPR/LGPD Violations**: HIGH - Falta de controle granular de dados
- **Performance Issues**: HIGH - Queries não otimizadas para multi-tenancy  
- **Audit Compliance**: BLOCKED - Impossível auditar acesso por organização

---

## 🎯 **Multi-Tenancy Strategy**

### **Tier-Based Isolation Models**

```typescript
interface MultiTenancyStrategy {
  tiers: {
    shared: {
      model: 'row-level-security';
      targetCustomers: 'SME, Individual, Pro Plans';
      isolation: 'application-level';
      performance: 'optimized-for-scale';
      cost: 'lowest';
    };
    
    schemaSeparated: {
      model: 'schema-per-tenant';
      targetCustomers: 'Business, Enterprise';
      isolation: 'database-schema-level';
      performance: 'balanced';
      cost: 'medium';
    };
    
    databaseSeparated: {
      model: 'database-per-tenant';
      targetCustomers: 'Enterprise, BYOC';
      isolation: 'complete-database-separation';
      performance: 'tenant-optimized';
      cost: 'highest';
    };
  };
}
```

### **Migration Strategy - 3 Phases**

#### **Phase 1: Schema Normalization (3-5 dias)**
```typescript
interface SchemaNormalization {
  addOrganizationColumns: {
    tables: [
      'Chat',
      'Document', 
      'McpServer',
      'ProjectFolder',
      'Message_v2',
      'Vote_v2',
      'Suggestion',
      'Stream'
    ];
    columnDefinition: 'organization_id UUID NOT NULL REFERENCES organizations(id)';
  };
  
  migrateExistingData: {
    strategy: 'default-to-first-organization';
    backupRequired: true;
    rollbackPlan: 'automated-rollback-script';
  };
  
  preserveRelations: {
    userRelations: 'maintained';
    foreignKeys: 'updated';
    indexes: 'rebuilt-with-org-id';
  };
}
```

#### **Phase 2: Row-Level Security (2-3 dias)**
```sql
-- Enable RLS on all tenant tables
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_chats ON chats
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY tenant_isolation_documents ON documents
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY tenant_isolation_mcp_servers ON mcp_servers
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY tenant_isolation_project_folders ON project_folders
    USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

#### **Phase 3: Application Layer Updates (3-4 dias)**
```typescript
interface ApplicationLayerUpdates {
  middleware: {
    tenantAware: 'mandatory-for-all-requests';
    organizationContext: 'extracted-from-session';
    rlsConfiguration: 'set-per-request';
  };
  
  queryUpdates: {
    allQueries: 'include-organization-id';
    validation: 'prevent-cross-tenant-access';
    performance: 'optimized-indexes';
  };
  
  apiRoutes: {
    authentication: 'organization-aware';
    authorization: 'tenant-scoped-permissions';
    validation: 'organization-id-required';
  };
}
```

---

## 🛠️ **Implementation Architecture**

### **Database Schema Updates**

```sql
-- Migration: Add organization_id to all tenant tables
ALTER TABLE chats ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE documents ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE mcp_servers ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);  
ALTER TABLE project_folders ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE messages_v2 ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE votes_v2 ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE suggestions ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
ALTER TABLE streams ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

-- Performance indexes
CREATE INDEX CONCURRENTLY idx_chats_org_user ON chats(organization_id, user_id);
CREATE INDEX CONCURRENTLY idx_documents_org_user ON documents(organization_id, user_id);
CREATE INDEX CONCURRENTLY idx_mcp_servers_org_user ON mcp_servers(organization_id, user_id);
CREATE INDEX CONCURRENTLY idx_project_folders_org_user ON project_folders(organization_id, user_id);

-- Audit table for cross-tenant access attempts
CREATE TABLE cross_tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempted_organization_id UUID NOT NULL,
  user_organization_id UUID NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID NOT NULL,
  access_denied_at TIMESTAMP DEFAULT NOW(),
  request_details JSONB
);
```

### **Middleware Implementation**

```typescript
// lib/middleware/tenant-context.ts
import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function tenantContextMiddleware(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null; // Will be handled by auth middleware
  }
  
  // Get user's organization context
  const userOrganization = await getUserOrganization(session.user.id);
  
  if (!userOrganization) {
    throw new Error('User not associated with any organization');
  }
  
  // Set organization context for RLS
  await setDatabaseContext({
    userId: session.user.id,
    organizationId: userOrganization.id
  });
  
  return {
    userId: session.user.id,
    organizationId: userOrganization.id,
    organizationRole: userOrganization.role
  };
}

// lib/db/context.ts
export async function setDatabaseContext(context: TenantContext) {
  await db.execute(sql`
    SELECT set_config('app.current_user_id', ${context.userId}, true),
           set_config('app.current_organization_id', ${context.organizationId}, true)
  `);
}
```

### **Query Pattern Updates**

```typescript
// Before (INSECURE)
export async function getChats(userId: string) {
  return await db.select().from(chats).where(eq(chats.userId, userId));
}

// After (SECURE)
export async function getChats(userId: string, organizationId: string) {
  return await db.select()
    .from(chats)
    .where(
      and(
        eq(chats.userId, userId),
        eq(chats.organizationId, organizationId)
      )
    );
}

// Helper function for all queries
export async function withTenantContext<T>(
  query: (context: TenantContext) => Promise<T>
): Promise<T> {
  const context = await getCurrentTenantContext();
  if (!context) {
    throw new Error('No tenant context available');
  }
  return await query(context);
}
```

### **API Route Updates**

```typescript
// app/api/chats/route.ts
export async function GET() {
  const context = await tenantContextMiddleware(request);
  
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const chats = await getChats(context.userId, context.organizationId);
    return NextResponse.json({ chats });
  } catch (error) {
    // Log potential cross-tenant access attempt
    await logCrossTenantAttempt({
      userId: context.userId,
      organizationId: context.organizationId,
      resourceType: 'chats',
      error: error.message
    });
    
    return NextResponse.json(
      { error: 'Access denied' }, 
      { status: 403 }
    );
  }
}
```

---

## 🔐 **BYOC via Parametrização**

### **Configuration-Based Infrastructure**

```typescript
interface BYOCConfiguration {
  organizationInfrastructure: {
    organizationId: string;
    tier: 'shared' | 'schema-separated' | 'database-separated';
    
    databaseConfig: {
      type: 'postgresql' | 'mysql' | 'mongodb';
      endpoint: string;
      credentials: EncryptedCredentials;
      connectionPool: ConnectionPoolConfig;
      sslConfig: SSLConfiguration;
    };
    
    llmConfig: {
      type: 'openai' | 'azure' | 'google' | 'anthropic';
      endpoint: string;
      apiKey: EncryptedApiKey;
      modelConfiguration: ModelConfig;
      rateLimits: RateLimitConfig;
    };
    
    storageConfig: {
      type: 's3' | 'azure-blob' | 'gcs' | 'local';
      endpoint: string;
      credentials: EncryptedCredentials;
      bucketConfig: BucketConfiguration;
      encryptionConfig: EncryptionConfig;
    };
  };
}
```

### **Adapter Pattern Implementation**

```typescript
// lib/adapters/database-adapter.ts
export abstract class DatabaseAdapter {
  abstract connect(config: DatabaseConfig): Promise<Connection>;
  abstract execute(query: string, params: any[]): Promise<any>;
  abstract transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  abstract healthCheck(): Promise<boolean>;
}

export class PostgreSQLAdapter extends DatabaseAdapter {
  async connect(config: PostgreSQLConfig): Promise<PGConnection> {
    return await createConnection({
      host: config.endpoint,
      credentials: await decrypt(config.credentials),
      ssl: config.sslConfig,
      pool: config.connectionPool
    });
  }
}

export class AzurePostgreSQLAdapter extends DatabaseAdapter {
  async connect(config: AzurePostgreSQLConfig): Promise<AzurePGConnection> {
    return await createAzureConnection({
      endpoint: config.endpoint,
      authentication: config.azureAuth,
      managedIdentity: config.managedIdentity
    });
  }
}

// lib/adapters/llm-adapter.ts
export abstract class LLMAdapter {
  abstract generateResponse(prompt: string, config: ModelConfig): Promise<string>;
  abstract validateApiKey(apiKey: string): Promise<boolean>;
  abstract getUsageMetrics(): Promise<UsageMetrics>;
}

// lib/adapters/storage-adapter.ts
export abstract class StorageAdapter {
  abstract upload(file: File, path: string): Promise<string>;
  abstract download(path: string): Promise<Buffer>;
  abstract delete(path: string): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
}
```

### **Configuration Management**

```sql
-- Organization Infrastructure Configuration
CREATE TABLE organization_infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('shared', 'schema-separated', 'database-separated')),
  
  database_config JSONB NOT NULL,
  llm_config JSONB NOT NULL,
  storage_config JSONB NOT NULL,
  
  health_status JSONB DEFAULT '{}',
  last_health_check TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Encrypted credentials storage
CREATE TABLE organization_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  service_type VARCHAR(50) NOT NULL,
  credential_key VARCHAR(100) NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_key_id VARCHAR(100) NOT NULL,
  
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, service_type, credential_key)
);
```

---

## 🔧 **Implementation Timeline**

### **Week 1: Schema Normalization**

#### **Days 1-2: Database Migration**
- [ ] **Backup Strategy**
  - Full database backup
  - Test restore procedures
  - Rollback script preparation

- [ ] **Schema Updates**
  - Add organization_id columns
  - Create performance indexes
  - Update foreign key constraints

#### **Days 3-4: Data Migration**
- [ ] **Existing Data Migration**
  - Migrate users to default organization
  - Update all existing records
  - Validate data integrity

- [ ] **RLS Implementation**
  - Enable row-level security
  - Create tenant isolation policies
  - Test policy effectiveness

#### **Day 5: Application Updates**
- [ ] **Query Updates**
  - Update all database queries
  - Add organization_id parameters
  - Implement tenant context helpers

### **Week 2: BYOC & Advanced Features**

#### **Days 1-2: Adapter Pattern**
- [ ] **Database Adapters**
  - PostgreSQL adapter
  - Azure PostgreSQL adapter
  - Connection pooling
  - Health checks

#### **Days 3-4: Configuration System**
- [ ] **Configuration Management**
  - Organization infrastructure setup
  - Encrypted credentials storage
  - Configuration validation
  - Health monitoring

#### **Day 5: Testing & Validation**
- [ ] **Security Testing**
  - Cross-tenant access prevention
  - RLS policy validation
  - Performance benchmarking
  - Audit log verification

---

## 📊 **Success Metrics**

### **Security Metrics**
- **Cross-tenant Data Leakage**: 0 incidents
- **Policy Effectiveness**: 100% tenant isolation
- **Audit Coverage**: 100% of data access logged
- **Compliance Score**: Pass all GDPR/LGPD checks

### **Performance Metrics**
- **Query Performance**: < 200ms median with organizationId filter
- **Connection Pool Efficiency**: > 90% utilization
- **BYOC Connection Success**: > 95% first-time setup
- **Health Check Response**: < 5 seconds

### **Operational Metrics**
- **Migration Success**: 100% data integrity maintained
- **Zero Downtime**: Migration without service interruption
- **Configuration Validation**: 100% endpoint validation success
- **Error Rate**: < 0.1% tenant context errors

---

## 🚨 **Risk Mitigation**

### **Technical Risks**
1. **Data Migration Risk**: Comprehensive testing + automated rollback
2. **Performance Degradation**: Optimized indexes + query analysis
3. **RLS Policy Gaps**: Extensive security testing + audit logging
4. **BYOC Connectivity**: Robust validation + fallback mechanisms

### **Business Risks**
1. **Customer Downtime**: Blue-green deployment strategy
2. **Data Loss**: Multiple backup layers + validation checks
3. **Compliance Issues**: Legal review + audit trail
4. **Performance Issues**: Load testing + monitoring

---

## 🔒 **Security Considerations**

### **Data Protection**
- **Encryption at Rest**: Customer-specific encryption keys
- **Encryption in Transit**: TLS 1.3 for all connections
- **Key Management**: Azure Key Vault integration
- **Access Logging**: Comprehensive audit trails

### **Compliance Framework**
- **GDPR**: Right to be forgotten + data portability
- **LGPD**: Data subject rights + consent management
- **SOC 2**: Security controls + audit requirements
- **HIPAA**: Healthcare-specific protections (BYOC)

---

## 🎯 **Enterprise Benefits**

### **Customer Value**
- **Data Sovereignty**: Complete control over data location
- **Compliance**: Built-in regulatory compliance
- **Performance**: Optimized for customer infrastructure
- **Cost Control**: Use existing infrastructure investments

### **Humana Benefits**
- **Market Differentiation**: True hybrid deployment model
- **Enterprise Sales**: Eliminate infrastructure objections
- **Scalability**: Support from SME to Fortune 500
- **Vendor Independence**: Customer chooses their stack

---

*Este blueprint estabelece foundation multi-tenant segura e BYOC-ready, eliminando riscos de vazamento de dados e habilitando vendas enterprise através de parametrização de infraestrutura.* 