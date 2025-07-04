'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  deleteMessageById,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { getOrganizationId } from '@/lib/tenant-context';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }

  const [message] = await getMessageById({ id, organizationId });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
    organizationId,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }

  await updateChatVisiblityById({ chatId, visibility, organizationId });
}

export async function deleteMessage({
  messageId,
  chatId,
}: {
  messageId: string;
  chatId: string;
}) {
  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }

  await deleteMessageById({ messageId, chatId, organizationId });
}

export async function getMessageByIdAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/guest');
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }

  const [message] = await getMessageById({ id, organizationId });

  return message;
}
