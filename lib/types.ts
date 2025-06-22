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
