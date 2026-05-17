import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users?username=xyz - Get user by username with recipes and follow status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        bio: true,
        location: true,
        smokerType: true,
        experienceLevel: true,
        joinedAt: true,
        recipes: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            cookTime: true,
            servings: true,
            difficulty: true,
            category: true,
            createdAt: true,
            images: { take: 1, select: { url: true } },
            _count: { select: { ratings: true } },
          },
        },
        _count: {
          select: {
            recipes: true,
            reviews: true,
            followers: true,
            follows: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let isFollowing = false;
    if (session?.user?.id && session.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id as string,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({ ...user, isFollowing });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
