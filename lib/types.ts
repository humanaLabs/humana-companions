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
