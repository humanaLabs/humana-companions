import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { projectFolder, chatFolder } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/tenant-context';

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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return new Response('Organization context required', { status: 403 });
    }

    const { name, color } = await request.json();
    
    if (!name?.trim()) {
      return new Response('Folder name is required', { status: 400 });
    }

    const [newFolder] = await db
      .insert(projectFolder)
      .values({
        name: name.trim(),
        color: color || null,
        userId: session.user.id,
        organizationId
      })
      .returning();

    return Response.json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    return new Response('Internal server error', { status: 500 });
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