export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'azure';
  features?: string[];
  isDefault?: boolean;
}

export const models: Array<ChatModel> = [
  {
    id: 'chat-model',
    provider: 'azure',
    name: 'GPT-4o (Azure)',
    description: 'Azure OpenAI GPT-4 Omni - Modelo multimodal avançado',
    features: ['text', 'image', 'code', 'reasoning'],
    isDefault: true,
  },
];
