import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { projectFolder, chatFolder } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const folders = await db
      .select()
      .from(projectFolder)
      .where(eq(projectFolder.userId, session.user.id))
      .orderBy(projectFolder.createdAt);

    return Response.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, color } = await request.json();

    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const [folder] = await db
      .insert(projectFolder)
      .values({
        name: name.trim(),
        color: color || 'bg-blue-500',
        userId: session.user.id,
      })
      .returning();

    return Response.json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
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
    const folderId = searchParams.get('id');

    if (!folderId) {
      return Response.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    // Remove all chat associations first
    await db
      .delete(chatFolder)
      .where(eq(chatFolder.folderId, folderId));

    // Delete the folder
    await db
      .delete(projectFolder)
      .where(
        and(
          eq(projectFolder.id, folderId),
          eq(projectFolder.userId, session.user.id)
        )
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 