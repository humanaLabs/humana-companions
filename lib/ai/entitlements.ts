import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<
  UserType,
  {
    maxMessagesPerDay: number;
    allowedModels: string[];
  }
> = {
  /*
   * Para usuários sem conta (guests)
   */
  guest: {
    maxMessagesPerDay: 1000, // Aumentado temporariamente para desenvolvimento
    allowedModels: [
      'chat-model',
    ],
  },

  /*
   * Para usuários com conta
   */
  regular: {
    maxMessagesPerDay: 100,
    allowedModels: [
      'chat-model',
    ],
  },

  /*
   * TODO: Para usuários com conta e assinatura paga
   */
};
