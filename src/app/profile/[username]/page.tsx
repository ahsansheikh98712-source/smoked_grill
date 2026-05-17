import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FollowButton } from '@/components/FollowButton';
import { MapPin, ChefHat, Clock, Users, Edit } from 'lucide-react';

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function difficultyColor(d: string) {
  if (d === 'EASY') return 'bg-green-100 text-green-800';
  if (d === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
  if (d === 'HARD') return 'bg-red-100 text-red-800';
  if (d === 'EXPERT') return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      image: true,
      location: true,
      joinedAt: true,
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
          images: { take: 1, select: { url: true } },
        },
      },
      _count: {
        select: { followers: true, follows: true },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  let isFollowing = false;
  if (session?.user?.id && !isOwnProfile) {
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

  const displayName = user.displayName || user.username;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-orange-600">Que-Munity</Link>
          <nav className="flex gap-6 text-sm text-gray-600">
            <Link href="/recipes" className="hover:text-orange-600">Recipes</Link>
            <Link href="/community" className="hover:text-orange-600">Community</Link>
            <Link href="/tools" className="hover:text-orange-600">Tools</Link>
            {session?.user ? (
              <Link href="/profile" className="text-orange-600 font-medium">My Profile</Link>
            ) : (
              <Link href="/auth/signin" className="text-orange-600 font-medium">Sign In</Link>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden">
              {user.image
                ? <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
                : displayName.charAt(0).toUpperCase()
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                  {user.location && (
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </p>
                  )}
                  {user.experienceLevel && (
                    <p className="text-gray-500 text-sm mt-1">🔥 {user.experienceLevel} Pitmaster</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {isOwnProfile ? (
                  <Link
                    href="/profile"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium self-start"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                ) : (
                  <FollowButton userId={user.id} initialIsFollowing={isFollowing} />
                )}
              </div>

              {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}

              <div className="flex gap-8">
                <div>
                  <div className="text-xl font-bold text-gray-900">{user._count.followers}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{user._count.follows}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{user.recipes.length}</div>
                  <div className="text-xs text-gray-500">Recipes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipes */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isOwnProfile ? 'My Recipes' : `${displayName}'s Recipes`}
          </h2>

          {user.recipes.length === 0 ? (
            <div className="text-center py-16">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {isOwnProfile ? "You haven't posted any recipes yet" : `${displayName} hasn't posted any recipes yet`}
              </p>
              {isOwnProfile && (
                <Link href="/recipes/create" className="mt-4 inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-medium">
                  Create First Recipe
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.recipes.map((recipe: any) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block group">
                  <div className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      {recipe.images[0]?.url
                        ? <img src={recipe.images[0].url} alt={recipe.title} className="w-full h-full object-cover" />
                        : <ChefHat className="w-12 h-12 text-white opacity-70" />
                      }
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2">
                        {recipe.title}
                      </h3>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-3">{recipe.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(recipe.difficulty)}`}>
                          {recipe.difficulty.charAt(0) + recipe.difficulty.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(recipe.cookTime)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {recipe.servings}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
