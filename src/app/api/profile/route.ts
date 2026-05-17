import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
      bio: true,
      image: true,
      location: true,
      joinedAt: true,
      onboardingDone: true,
      favoriteMeats: true,
      cookerType: true,
      skillLevel: true,
      bbqStyle: true,
      experienceLevel: true,
      smokerType: true,
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
          _count: { select: { ratings: true, favorites: true } },
        },
      },
      _count: {
        select: {
          followers: true,
          follows: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(user);
}
