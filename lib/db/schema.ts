import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  isMasterAdmin: boolean('isMasterAdmin').notNull().default(false),
  plan: varchar('plan', { enum: ['free', 'pro', 'guest'] })
    .notNull()
    .default('free'),
  messagesSent: integer('messagesSent').notNull().default(0),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId').references(() => organization.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const projectFolder = pgTable('ProjectFolder', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }).notNull().default('bg-blue-500'),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type ProjectFolder = InferSelectModel<typeof projectFolder>;

export const chatFolder = pgTable(
  'ChatFolder',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    folderId: uuid('folderId')
      .notNull()
      .references(() => projectFolder.id),
    addedAt: timestamp('addedAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.folderId] }),
    };
  },
);

export type ChatFolder = InferSelectModel<typeof chatFolder>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

export const companion = pgTable('Companion', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  role: text('role').notNull(),
  responsibilities: json('responsibilities').notNull(), // Array de strings
  expertises: json('expertises').notNull(), // Array de objetos {area, topics}
  sources: json('sources').notNull(), // Array de objetos {type, description}
  rules: json('rules').notNull(), // Array de objetos {type, description}
  contentPolicy: json('contentPolicy').notNull(), // Objeto {allowed, disallowed}
  skills: json('skills'), // Array de objetos com skills avançadas (opcional)
  fallbacks: json('fallbacks'), // Objeto com respostas padrão (opcional)
  // Campos de vinculação organizacional
  organizationId: uuid('organizationId').references(() => organization.id),
  positionId: text('positionId'), // ID da posição na estrutura JSON da organização
  linkedTeamId: text('linkedTeamId'), // ID da equipe na estrutura JSON da organização
  // Campos legados para compatibilidade
  instruction: text('instruction'), // Deprecated, será removido após migração
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Companion = InferSelectModel<typeof companion>;

export const mcpServer = pgTable('McpServer', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  url: text('url').notNull(),
  transport: varchar('transport', { enum: ['sse', 'stdio'] })
    .notNull()
    .default('sse'),
  description: text('description'),
  isActive: boolean('isActive').notNull().default(true),
  // Campos de autenticação
  authType: varchar('authType', { enum: ['none', 'bearer', 'basic', 'apikey'] })
    .notNull()
    .default('none'),
  authToken: text('authToken'), // Para Bearer Token ou API Key
  authUsername: varchar('authUsername', { length: 100 }), // Para Basic Auth
  authPassword: varchar('authPassword', { length: 100 }), // Para Basic Auth
  authHeaderName: varchar('authHeaderName', { length: 50 }), // Para API Key (nome do header)
  // Status de conexão real
  isConnected: boolean('isConnected').notNull().default(false),
  lastConnectionTest: timestamp('lastConnectionTest'),
  connectionError: text('connectionError'),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type McpServer = InferSelectModel<typeof mcpServer>;

export const organization = pgTable('Organization', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  tenantConfig: json('tenantConfig').notNull(), // Configurações do tenant
  values: json('values').notNull(), // Array de valores organizacionais
  teams: json('teams').notNull(), // Array de equipes
  positions: json('positions').notNull(), // Array de posições/cargos
  orgUsers: json('orgUsers').notNull(), // Array de usuários da organização
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Organization = InferSelectModel<typeof organization>;

// Tabela para feedback dos companions
export const companionFeedback = pgTable('CompanionFeedback', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  companionId: uuid('companionId')
    .notNull()
    .references(() => companion.id),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  type: varchar('type', {
    enum: ['positive', 'negative', 'suggestion'],
  }).notNull(),
  category: varchar('category', {
    enum: ['accuracy', 'helpfulness', 'relevance', 'tone', 'completeness'],
  }).notNull(),
  rating: varchar('rating', { length: 1 }).notNull(), // 1-5
  comment: text('comment').notNull(),
  interactionId: uuid('interactionId'), // Referência à interação específica (opcional)
  metadata: json('metadata'), // Dados adicionais sobre o contexto
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type CompanionFeedback = InferSelectModel<typeof companionFeedback>;

// Tabela para interações dos companions (para análise de performance)
export const companionInteraction = pgTable('CompanionInteraction', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  companionId: uuid('companionId')
    .notNull()
    .references(() => companion.id),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  chatId: uuid('chatId').references(() => chat.id),
  messageId: uuid('messageId').references(() => message.id),
  type: varchar('type', {
    enum: ['question', 'task', 'consultation', 'feedback_request'],
  }).notNull(),
  context: json('context'), // Contexto da interação
  response: json('response'), // Resposta do companion
  duration: varchar('duration', { length: 10 }), // Duração da interação em ms
  tokens_used: varchar('tokens_used', { length: 10 }), // Tokens utilizados
  success: boolean('success').default(true), // Se a interação foi bem-sucedida
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type CompanionInteraction = InferSelectModel<
  typeof companionInteraction
>;

// Tabela para relatórios do ciclo MCP
export const mcpCycleReport = pgTable('McpCycleReport', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  companionId: uuid('companionId')
    .notNull()
    .references(() => companion.id),
  cycleDate: timestamp('cycleDate').notNull().defaultNow(),
  metrics: json('metrics').notNull(), // Métricas quantitativas
  analysis: json('analysis').notNull(), // Análise qualitativa da IA
  recommendations: json('recommendations').notNull(), // Recomendações de melhoria
  nextSteps: json('nextSteps').notNull(), // Próximos passos
  improvementSuggestions: json('improvementSuggestions'), // Sugestões de melhoria específicas
  status: varchar('status', {
    enum: ['pending', 'in_progress', 'completed', 'failed'],
  })
    .notNull()
    .default('pending'),
  executedBy: uuid('executedBy').references(() => user.id), // Quem executou o ciclo
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type McpCycleReport = InferSelectModel<typeof mcpCycleReport>;

// Tabela para performance dos companions (métricas agregadas)
export const companionPerformance = pgTable('CompanionPerformance', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  companionId: uuid('companionId')
    .notNull()
    .references(() => companion.id),
  // Métricas de feedback
  averageRating: varchar('averageRating', { length: 3 }), // Ex: "4.2"
  totalFeedback: varchar('totalFeedback', { length: 10 }).default('0'),
  positiveFeedbackRate: varchar('positiveFeedbackRate', { length: 5 }), // Ex: "85.5"
  lastFeedbackAt: timestamp('lastFeedbackAt'),
  // Métricas de interação
  totalInteractions: varchar('totalInteractions', { length: 10 }).default('0'),
  averageResponseTime: varchar('averageResponseTime', { length: 10 }), // Em ms
  successRate: varchar('successRate', { length: 5 }), // Ex: "92.3"
  lastInteractionAt: timestamp('lastInteractionAt'),
  // Métricas de MCP
  lastMcpCycleAt: timestamp('lastMcpCycleAt'),
  mcpScore: varchar('mcpScore', { length: 4 }), // Score de 1-10
  improvementTrend: varchar('improvementTrend', {
    enum: ['improving', 'stable', 'declining', 'unknown'],
  }).default('unknown'),
  // Timestamps
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type CompanionPerformance = InferSelectModel<
  typeof companionPerformance
>;

// ============================================================================
// SISTEMA DE ADMINISTRAÇÃO - FASE 2
// ============================================================================

// Tabela de Roles (Admin, Manager, User)
export const role = pgTable('Role', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('displayName', { length: 100 }).notNull(),
  description: text('description'),
  permissions: json('permissions').notNull(), // Array de permissões
  isSystemRole: boolean('isSystemRole').notNull().default(false), // Para roles do sistema (Admin, Manager, User)
  organizationId: uuid('organizationId').references(() => organization.id), // null = role global
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Role = InferSelectModel<typeof role>;

// Tabela de Teams
export const team = pgTable('Team', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
  parentTeamId: uuid('parentTeamId'), // Para hierarquia de times - referência será adicionada após
  managerId: uuid('managerId').references(() => user.id), // Manager do time
  settings: json('settings'), // Configurações específicas do time
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Team = InferSelectModel<typeof team>;

// Tabela de User-Role assignments
export const userRole = pgTable('UserRole', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  roleId: uuid('roleId')
    .notNull()
    .references(() => role.id),
  organizationId: uuid('organizationId').references(() => organization.id), // null = role global
  teamId: uuid('teamId').references(() => team.id), // null = role organizacional
  assignedBy: uuid('assignedBy')
    .notNull()
    .references(() => user.id),
  assignedAt: timestamp('assignedAt').notNull().defaultNow(),
  expiresAt: timestamp('expiresAt'), // null = sem expiração
  isActive: boolean('isActive').notNull().default(true),
  metadata: json('metadata'), // Dados adicionais sobre a atribuição
});

export type UserRole = InferSelectModel<typeof userRole>;

// Tabela de Team Members
export const teamMember = pgTable(
  'TeamMember',
  {
    teamId: uuid('teamId')
      .notNull()
      .references(() => team.id),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    roleInTeam: varchar('roleInTeam', {
      enum: ['member', 'lead', 'manager', 'admin'],
    })
      .notNull()
      .default('member'),
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
    addedBy: uuid('addedBy')
      .notNull()
      .references(() => user.id),
    isActive: boolean('isActive').notNull().default(true),
    permissions: json('permissions'), // Permissões específicas no time
  },
  (table) => {
    return {
      // Chave primária composta para evitar duplicatas
      pk: primaryKey({ columns: [table.teamId, table.userId] }),
    };
  },
);

export type TeamMember = InferSelectModel<typeof teamMember>;

// Tabela de User-Organization assignments
export const userOrganization = pgTable(
  'UserOrganization',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id),
    roleInOrganization: varchar('roleInOrganization', {
      enum: ['owner', 'admin', 'manager', 'member', 'guest'],
    })
      .notNull()
      .default('member'),
    invitedBy: uuid('invitedBy').references(() => user.id),
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
    invitedAt: timestamp('invitedAt'),
    lastActiveAt: timestamp('lastActiveAt'),
    status: varchar('status', {
      enum: ['active', 'inactive', 'pending', 'suspended'],
    })
      .notNull()
      .default('active'),
    settings: json('settings'), // Configurações específicas do usuário na organização
  },
  (table) => {
    return {
      // Chave primária composta para evitar duplicatas
      pk: primaryKey({ columns: [table.userId, table.organizationId] }),
    };
  },
);

export type UserOrganization = InferSelectModel<typeof userOrganization>;

// Tabela de Audit Log para rastreamento de ações administrativas
export const auditLog = pgTable('AuditLog', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId').references(() => organization.id),
  teamId: uuid('teamId').references(() => team.id),
  action: varchar('action', { length: 100 }).notNull(), // Ex: 'user.role.assigned', 'team.created'
  resource: varchar('resource', { length: 50 }).notNull(), // Ex: 'user', 'team', 'organization'
  resourceId: uuid('resourceId'), // ID do recurso afetado
  oldValues: json('oldValues'), // Valores antes da mudança
  newValues: json('newValues'), // Valores após a mudança
  ipAddress: varchar('ipAddress', { length: 45 }), // IPv4 ou IPv6
  userAgent: text('userAgent'),
  metadata: json('metadata'), // Dados contextuais adicionais
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type AuditLog = InferSelectModel<typeof auditLog>;

// Tabela de User Invites para sistema de convites
export const userInvite = pgTable('UserInvite', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  roleId: uuid('roleId')
    .notNull()
    .references(() => role.id),
  organizationId: uuid('organizationId').references(() => organization.id),
  invitedBy: uuid('invitedBy')
    .notNull()
    .references(() => user.id),
  token: varchar('token', { length: 64 }).notNull().unique(),
  message: text('message'), // Mensagem personalizada do convite
  status: varchar('status', {
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  expiresAt: timestamp('expiresAt').notNull(),
  acceptedAt: timestamp('acceptedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type UserInvite = InferSelectModel<typeof userInvite>;

// LearnGen Protocol - User Cognitive Profile
export const userCognitiveProfile = pgTable('UserCognitiveProfile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId').references(() => organization.id),

  // Cognitive Style Assessment
  primaryCognitiveStyle: varchar('primaryCognitiveStyle', {
    length: 20,
  }).notNull(), // visual, auditory, kinesthetic, reading
  secondaryCognitiveStyle: varchar('secondaryCognitiveStyle', { length: 20 }),
  adaptationLevel: varchar('adaptationLevel', { length: 10 }).notNull(), // high, medium, low

  // Experience Level
  aiToolsExperience: varchar('aiToolsExperience', { length: 20 }).notNull(), // novice, intermediate, advanced
  businessContext: varchar('businessContext', { length: 20 }).notNull(), // individual, team, organization
  technicalSkills: varchar('technicalSkills', { length: 20 }).notNull(), // basic, intermediate, advanced

  // Learning Goals
  primaryGoal: text('primaryGoal').notNull(),
  secondaryGoals: jsonb('secondaryGoals').$type<string[]>().default([]),
  timeframe: varchar('timeframe', { length: 20 }).notNull(), // immediate, short-term, long-term

  // Organizational Context
  role: varchar('role', { length: 100 }),
  department: varchar('department', { length: 100 }),
  useCase: text('useCase'),
  teamSize: integer('teamSize'),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// LearnGen Protocol - Onboarding Progress
export const onboardingProgress = pgTable('OnboardingProgress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId').references(() => organization.id),

  // Flow Progress
  currentStep: integer('currentStep').notNull().default(0),
  totalSteps: integer('totalSteps').notNull(),
  completionRate: real('completionRate').notNull().default(0), // 0-100

  // Time Tracking
  timeSpent: integer('timeSpent').notNull().default(0), // minutes
  startedAt: timestamp('startedAt').defaultNow().notNull(),
  completedAt: timestamp('completedAt'),

  // Adaptation Data
  strugglingPoints: jsonb('strugglingPoints').$type<string[]>().default([]),
  adaptationEvents: jsonb('adaptationEvents').$type<any[]>().default([]),
  personalizedContent: jsonb('personalizedContent').$type<any>().default({}),

  // Success Metrics
  featureDiscoveryRate: real('featureDiscoveryRate').default(0), // 0-100
  interactionQuality: real('interactionQuality').default(0), // 0-100
  confidenceLevel: real('confidenceLevel').default(0), // 0-100

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// University - Learning Modules
export const learningModule = pgTable('LearningModule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organizationId').references(() => organization.id),

  // Module Info
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(), // getting-started, advanced, etc.

  // Content
  duration: integer('duration').notNull(), // minutes
  difficultyLevel: varchar('difficultyLevel', { length: 20 }).notNull(), // beginner, intermediate, advanced
  learningObjectives: jsonb('learningObjectives').$type<string[]>().notNull(),

  // Organization
  isActive: boolean('isActive').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  prerequisites: jsonb('prerequisites').$type<string[]>().default([]),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// University - Learning Lessons
export const learningLesson = pgTable('LearningLesson', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('moduleId')
    .notNull()
    .references(() => learningModule.id),

  // Lesson Info
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull(),

  // Content
  type: varchar('type', { length: 20 }).notNull(), // interactive, video, hands-on, quiz
  duration: integer('duration').notNull(), // minutes
  content: jsonb('content').$type<any>().notNull(), // lesson content structure

  // Learning Design
  learningObjectives: jsonb('learningObjectives').$type<string[]>().notNull(),
  interactiveElements: jsonb('interactiveElements').$type<any[]>().default([]),
  assessmentQuestions: jsonb('assessmentQuestions').$type<any[]>().default([]),

  // Organization
  sortOrder: integer('sortOrder').notNull().default(0),
  isActive: boolean('isActive').notNull().default(true),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// University - User Progress
export const userLearningProgress = pgTable(
  'UserLearningProgress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    organizationId: uuid('organizationId').references(() => organization.id),
    moduleId: uuid('moduleId')
      .notNull()
      .references(() => learningModule.id),
    lessonId: uuid('lessonId').references(() => learningLesson.id),

    // Progress Tracking
    status: varchar('status', { length: 20 }).notNull(), // not-started, in-progress, completed, certified
    progressPercentage: real('progressPercentage').notNull().default(0), // 0-100
    timeSpent: integer('timeSpent').notNull().default(0), // minutes

    // Assessment
    quizScore: real('quizScore'), // 0-100
    practicalScore: real('practicalScore'), // 0-100
    attempts: integer('attempts').notNull().default(0),

    // Timestamps
    startedAt: timestamp('startedAt'),
    completedAt: timestamp('completedAt'),
    certifiedAt: timestamp('certifiedAt'),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.moduleId] }),
  }),
);

// University - Certifications
export const userCertification = pgTable('UserCertification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId').references(() => organization.id),
  moduleId: uuid('moduleId')
    .notNull()
    .references(() => learningModule.id),

  // Certification Details
  certificateTitle: varchar('certificateTitle', { length: 200 }).notNull(),
  issuer: varchar('issuer', { length: 100 })
    .notNull()
    .default('Humana AI University'),
  certificateId: varchar('certificateId', { length: 50 }).notNull().unique(),

  // Scoring
  finalScore: real('finalScore').notNull(), // 0-100
  passingScore: real('passingScore').notNull().default(80),

  // Validity
  issuedAt: timestamp('issuedAt').defaultNow().notNull(),
  validUntil: timestamp('validUntil'),
  isActive: boolean('isActive').notNull().default(true),

  // Branding (for organizations)
  customBranding: jsonb('customBranding').$type<any>().default({}),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// University - Community Forums
export const communityForum = pgTable('CommunityForum', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organizationId').references(() => organization.id),

  // Forum Info
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(), // getting-started, advanced-usage, troubleshooting, best-practices

  // Organization
  isActive: boolean('isActive').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// University - Forum Posts
export const forumPost = pgTable('ForumPost', {
  id: uuid('id').primaryKey().defaultRandom(),
  forumId: uuid('forumId')
    .notNull()
    .references(() => communityForum.id),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId').references(() => organization.id),
  parentPostId: uuid('parentPostId'), // for replies - self-reference handled via migration

  // Post Content
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('discussion'), // discussion, question, answer

  // Engagement
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  replyCount: integer('replyCount').notNull().default(0),

  // Moderation
  isApproved: boolean('isApproved').notNull().default(true),
  isHidden: boolean('isHidden').notNull().default(false),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});
