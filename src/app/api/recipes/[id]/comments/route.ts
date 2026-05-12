import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notify';

// GET /api/recipes/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const comments = await prisma.comment.findMany({
      where: { recipeId: id, parentId: null },
      include: {
        user: { select: { id: true, username: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/recipes/[id]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content, parentId, imageUrl } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { title: true, authorId: true },
    });
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const commenterUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { username: true, image: true },
    });

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl ?? null,
        recipeId: id,
        userId: session.user.id as string,
        ...(parentId && { parentId }),
      },
      include: {
        user: { select: { id: true, username: true, image: true } },
        replies: {
          include: { user: { select: { id: true, username: true, image: true } } },
        },
      },
    });
    if (recipe && recipe.authorId !== (session.user.id as string)) {
      await createNotification({
        userId: recipe.authorId,
        type: 'comment',
        message: `${commenterUser?.username ?? 'Someone'} commented on your recipe "${recipe.title}"`,
        link: `/recipes/${id}`,
        actorName: commenterUser?.username,
        actorImage: commenterUser?.image ?? undefined,
      });
    }

    // If it's a reply, also notify the parent comment author
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      });
      if (parent && parent.userId !== (session.user.id as string) && parent.userId !== recipe?.authorId) {
        await createNotification({
          userId: parent.userId,
          type: 'reply',
          message: `${commenterUser?.username ?? 'Someone'} replied to your comment`,
          link: `/recipes/${id}`,
          actorName: commenterUser?.username,
          actorImage: commenterUser?.image ?? undefined,
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/comments?commentId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // await even if unused to satisfy Next.js 15
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== (session.user.id as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
