import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chatFolder, chat, projectFolder } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return Response.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    // Get chats in the folder
    const chatsInFolder = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        visibility: chat.visibility,
        addedAt: chatFolder.addedAt,
      })
      .from(chatFolder)
      .innerJoin(chat, eq(chatFolder.chatId, chat.id))
      .innerJoin(projectFolder, eq(chatFolder.folderId, projectFolder.id))
      .where(
        and(
          eq(chatFolder.folderId, folderId),
          eq(projectFolder.userId, session.user.id),
          eq(chat.userId, session.user.id)
        )
      )
      .orderBy(chatFolder.addedAt);

    return Response.json(chatsInFolder);
  } catch (error) {
    console.error('Error fetching folder chats:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { chatId, folderId } = await request.json();

    if (!chatId || !folderId) {
      return Response.json({ error: 'Chat ID and Folder ID are required' }, { status: 400 });
    }

    // Verify the chat belongs to the user
    const userChat = await db
      .select({ id: chat.id })
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)))
      .limit(1);

    if (userChat.length === 0) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the folder belongs to the user
    const userFolder = await db
      .select({ id: projectFolder.id })
      .from(projectFolder)
      .where(and(eq(projectFolder.id, folderId), eq(projectFolder.userId, session.user.id)))
      .limit(1);

    if (userFolder.length === 0) {
      return Response.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Add chat to folder (ignore if already exists)
    await db
      .insert(chatFolder)
      .values({
        chatId,
        folderId,
      })
      .onConflictDoNothing();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error adding chat to folder:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const folderId = searchParams.get('folderId');

    if (!chatId || !folderId) {
      return Response.json({ error: 'Chat ID and Folder ID are required' }, { status: 400 });
    }

    // Verify ownership through the folder
    const userFolder = await db
      .select({ id: projectFolder.id })
      .from(projectFolder)
      .where(and(eq(projectFolder.id, folderId), eq(projectFolder.userId, session.user.id)))
      .limit(1);

    if (userFolder.length === 0) {
      return Response.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Remove chat from folder
    await db
      .delete(chatFolder)
      .where(
        and(
          eq(chatFolder.chatId, chatId),
          eq(chatFolder.folderId, folderId)
        )
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error removing chat from folder:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 