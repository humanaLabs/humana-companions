export type Model = 'chat-model';

export type DataPart = { type: 'append-message'; message: string };

// Companion Types - Estrutura completa baseada nos JSONs de exemplo
export interface CompanionExpertise {
  area: string;
  topics: string[];
}

export interface CompanionSource {
  type: string;
  description: string;
}

export interface CompanionRule {
  type: 'tone' | 'restriction' | 'clarification_prompt';
  description: string;
}

export interface CompanionContentPolicy {
  allowed: string[];
  disallowed: string[];
}

export interface CompanionSkillData {
  origem: string;
  descricao: string;
}

export interface CompanionSkillFile {
  nome: string;
  descricao: string;
}

export interface CompanionSkill {
  name: string;
  description: string;
  tools?: string[];
  templates?: string[];
  dados?: CompanionSkillData[];
  arquivos?: CompanionSkillFile[];
  example?: string;
}

export interface CompanionFallbacks {
  ambiguous?: string;
  out_of_scope?: string;
  unknown?: string;
}

export interface CompanionStructure {
  id?: string;
  name: string;
  role: string;
  responsibilities: string[];
  expertises: CompanionExpertise[];
  sources: CompanionSource[];
  rules: CompanionRule[];
  contentPolicy: CompanionContentPolicy;
  skills?: CompanionSkill[];
  fallbacks?: CompanionFallbacks;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Campo legado
  instruction?: string;
}

// Organization Types - Estrutura completa para organizações
export interface OrganizationTenantConfig {
  timezone: string;
  language: string;
  llm_provider: string;
  default_model: string;
}

export interface OrganizationValue {
  name: string;
  description: string;
  expected_behaviors: string[];
}

export interface OrganizationTeamMember {
  user_id: string;
  role: 'admin' | 'viewer' | 'editor';
  permissions: string[];
}

export interface OrganizationTeam {
  id: string;
  name: string;
  description: string;
  members: OrganizationTeamMember[];
}

export interface OrganizationPositionCompanion {
  companion_id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  linked_team_id: string;
}

export interface OrganizationPosition {
  id: string;
  title: string;
  description: string;
  reports_to: string | null;
  r_and_r: string[];
  companions: OrganizationPositionCompanion[];
}

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  teams: string[];
  accessible_companions: string[];
}

export interface OrganizationStructure {
  id?: string;
  name: string;
  description: string;
  tenantConfig: OrganizationTenantConfig;
  values: OrganizationValue[];
  teams: OrganizationTeam[];
  positions: OrganizationPosition[];
  orgUsers: OrganizationUser[];
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base User type (simplified)
export interface User {
  id: string;
  name: string;
  email: string;
}

// ========================================
// LEARNGEN PROTOCOL TYPES
// ========================================

export interface UserCognitiveProfile {
  id: string;
  userId: string;
  organizationId?: string;
  
  // Cognitive Style Assessment
  primaryCognitiveStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  secondaryCognitiveStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  adaptationLevel: 'high' | 'medium' | 'low';
  
  // Experience Level
  aiToolsExperience: 'novice' | 'intermediate' | 'advanced';
  businessContext: 'individual' | 'team' | 'organization';
  technicalSkills: 'basic' | 'intermediate' | 'advanced';
  
  // Learning Goals
  primaryGoal: string;
  secondaryGoals: string[];
  timeframe: 'immediate' | 'short-term' | 'long-term';
  
  // Organizational Context
  role?: string;
  department?: string;
  useCase?: string;
  teamSize?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  organizationId?: string;
  
  // Flow Progress
  currentStep: number;
  totalSteps: number;
  completionRate: number; // 0-100
  
  // Time Tracking
  timeSpent: number; // minutes
  startedAt: Date;
  completedAt?: Date;
  
  // Adaptation Data
  strugglingPoints: string[];
  adaptationEvents: any[];
  personalizedContent: any;
  
  // Success Metrics
  featureDiscoveryRate: number; // 0-100
  interactionQuality: number; // 0-100
  confidenceLevel: number; // 0-100
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AdaptiveLearningSession {
  duration: 2 | 3 | 5; // minutes
  content: {
    type: 'interactive' | 'video' | 'hands-on' | 'quiz';
    title: string;
    description: string;
    learningObjective: string;
  };
  adaptiveLogic: {
    prerequisites: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    personalizedContent: boolean;
    realTimeAdjustment: boolean;
  };
  contextualApplication: {
    realWorldScenario: string;
    practiceOpportunity: boolean;
    immediateApplication: boolean;
  };
}

// ========================================
// UNIVERSITY CORE TYPES
// ========================================

export interface LearningModule {
  id: string;
  organizationId?: string;
  
  // Module Info
  title: string;
  description?: string;
  slug: string;
  category: 'getting-started' | 'advanced-usage' | 'troubleshooting' | 'best-practices' | 'enterprise';
  
  // Content
  duration: number; // minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  
  // Organization
  isActive: boolean;
  sortOrder: number;
  prerequisites: string[];
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (for populated queries)
  lessons?: LearningLesson[];
}

export interface LearningLesson {
  id: string;
  moduleId: string;
  
  // Lesson Info
  title: string;
  description?: string;
  slug: string;
  
  // Content
  type: 'interactive' | 'video' | 'hands-on' | 'quiz';
  duration: number; // minutes
  content: any; // lesson content structure
  
  // Learning Design
  learningObjectives: string[];
  interactiveElements: any[];
  assessmentQuestions: any[];
  
  // Organization
  sortOrder: number;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  module?: LearningModule;
}

export interface UserLearningProgress {
  id: string;
  userId: string;
  organizationId?: string;
  moduleId: string;
  lessonId?: string;
  
  // Progress Tracking
  status: 'not-started' | 'in-progress' | 'completed' | 'certified';
  progressPercentage: number; // 0-100
  timeSpent: number; // minutes
  
  // Assessment
  quizScore?: number; // 0-100
  practicalScore?: number; // 0-100
  attempts: number;
  
  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  certifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  module?: LearningModule;
  lesson?: LearningLesson;
}

export interface UserCertification {
  id: string;
  userId: string;
  organizationId?: string;
  moduleId: string;
  
  // Certification Details
  certificateTitle: string;
  issuer: string;
  certificateId: string;
  
  // Scoring
  finalScore: number; // 0-100
  passingScore: number; // 0-100
  
  // Validity
  issuedAt: Date;
  validUntil?: Date;
  isActive: boolean;
  
  // Branding (for organizations)
  customBranding: any;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  module?: LearningModule;
}

export interface CommunityForum {
  id: string;
  organizationId?: string;
  
  // Forum Info
  title: string;
  description?: string;
  slug: string;
  category: 'getting-started' | 'advanced-usage' | 'troubleshooting' | 'best-practices';
  
  // Organization
  isActive: boolean;
  sortOrder: number;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  posts?: ForumPost[];
  postCount?: number;
}

export interface ForumPost {
  id: string;
  forumId: string;
  userId: string;
  organizationId?: string;
  parentPostId?: string;
  
  // Post Content
  title?: string;
  content: string;
  type: 'discussion' | 'question' | 'answer';
  
  // Engagement
  upvotes: number;
  downvotes: number;
  replyCount: number;
  
  // Moderation
  isApproved: boolean;
  isHidden: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  forum?: CommunityForum;
  author?: User;
  replies?: ForumPost[];
  parentPost?: ForumPost;
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

export interface CreateCognitiveProfileRequest {
  primaryCognitiveStyle: UserCognitiveProfile['primaryCognitiveStyle'];
  secondaryCognitiveStyle?: UserCognitiveProfile['secondaryCognitiveStyle'];
  adaptationLevel: UserCognitiveProfile['adaptationLevel'];
  aiToolsExperience: UserCognitiveProfile['aiToolsExperience'];
  businessContext: UserCognitiveProfile['businessContext'];
  technicalSkills: UserCognitiveProfile['technicalSkills'];
  primaryGoal: string;
  secondaryGoals?: string[];
  timeframe: UserCognitiveProfile['timeframe'];
  role?: string;
  department?: string;
  useCase?: string;
  teamSize?: number;
}

export interface UpdateOnboardingProgressRequest {
  currentStep?: number;
  completionRate?: number;
  timeSpent?: number;
  strugglingPoints?: string[];
  adaptationEvents?: any[];
  personalizedContent?: any;
  featureDiscoveryRate?: number;
  interactionQuality?: number;
  confidenceLevel?: number;
  completedAt?: Date;
}

export interface CreateLearningModuleRequest {
  title: string;
  description?: string;
  slug: string;
  category: LearningModule['category'];
  duration: number;
  difficultyLevel: LearningModule['difficultyLevel'];
  learningObjectives: string[];
  prerequisites?: string[];
}

export interface CreateLearningLessonRequest {
  moduleId: string;
  title: string;
  description?: string;
  slug: string;
  type: LearningLesson['type'];
  duration: number;
  content: any;
  learningObjectives: string[];
  interactiveElements?: any[];
  assessmentQuestions?: any[];
}

export interface UpdateLearningProgressRequest {
  status?: UserLearningProgress['status'];
  progressPercentage?: number;
  timeSpent?: number;
  quizScore?: number;
  practicalScore?: number;
  attempts?: number;
  startedAt?: Date;
  completedAt?: Date;
  certifiedAt?: Date;
}

export interface LearningAnalytics {
  userProgress: {
    totalModules: number;
    completedModules: number;
    inProgressModules: number;
    totalTimeSpent: number; // minutes
    averageScore: number; // 0-100
    certificationsEarned: number;
  };
  organizationProgress?: {
    totalUsers: number;
    activeUsers: number;
    completionRate: number; // 0-100
    averageTime: number; // minutes
    topModules: { moduleId: string; title: string; completions: number }[];
  };
}

// ========================================
// LEARNGEN ONBOARDING FLOW TYPES
// ========================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'assessment' | 'tutorial' | 'practice' | 'validation';
  content: any;
  estimatedDuration: number; // minutes
  isCompleted: boolean;
  personalizedContent?: any;
}

export interface OnboardingFlow {
  steps: OnboardingStep[];
  currentStepIndex: number;
  adaptationLogic: {
    strugglingThreshold: number; // seconds before considered struggling
    skipCriteria: any;
    personalizedContent: any;
  };
}

export interface ContextualTooltip {
  id: string;
  element: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  trigger: 'hover' | 'click' | 'focus';
  isActive: boolean;
  personalizedFor?: UserCognitiveProfile['primaryCognitiveStyle'];
}

export interface GuidanceOverlay {
  id: string;
  title: string;
  content: string;
  targetElement: string; // CSS selector
  type: 'highlight' | 'modal' | 'popover';
  isSkippable: boolean;
  adaptiveContent?: any;
}

// ========================================
// UNIVERSITY ASSESSMENT TYPES
// ========================================

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'essay';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjective: string;
}

export interface PracticalScenario {
  id: string;
  title: string;
  description: string;
  scenario: string;
  tasks: string[];
  evaluationCriteria: EvaluationCriteria[];
  timeLimit?: number; // minutes
}

export interface EvaluationCriteria {
  id: string;
  criterion: string;
  description: string;
  weight: number; // percentage of total score
  maxScore: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  template: string; // HTML template
  variables: string[]; // template variables
  styling: any; // CSS styling
  organizationBranding?: any;
}
