export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai';
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'GPT-4 Turbo',
    description: 'OpenAI model for all-purpose chat',
    provider: 'openai'
  },
  {
    id: 'chat-model-reasoning',
    name: 'GPT-4 Reasoning',
    description: 'OpenAI model with advanced reasoning',
    provider: 'openai'
  },
];
