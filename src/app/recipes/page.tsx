'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Clock, Users, Star, ChefHat, ArrowLeft, Plus, Heart } from 'lucide-react';
import { FollowButton } from '@/components/FollowButton';
import ShareButton from '@/components/ShareButton';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: string;
  avgRating: number;
  totalReviews: number;
  cookingMethod: string;
  smokingWood?: string | null;
  author: { id: string; username: string };
  primaryImage?: string | null;
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function difficultyLabel(d: string) {
  return d.charAt(0) + d.slice(1).toLowerCase();
}

function difficultyColor(d: string) {
  if (d === 'EASY') return 'bg-green-100 text-green-800';
  if (d === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
  if (d === 'HARD') return 'bg-red-100 text-red-800';
  if (d === 'EXPERT') return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

function LikeButton({ recipeId }: { recipeId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) { router.push('/auth/signin'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${session.user.id}/favorites`, {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });
      if (res.ok) setLiked(l => !l);
    } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={liked ? 'Unlike' : 'Like'}
      className={`p-2 rounded-full transition-colors ${liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'}`}
    >
      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
    </button>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/recipes/${recipe.id}`}>
        <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center relative overflow-hidden">
          {recipe.primaryImage ? (
            <img src={recipe.primaryImage} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <ChefHat className="h-16 w-16 text-white opacity-80" />
          )}
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/recipes/${recipe.id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-1 hover:text-orange-600 transition-colors line-clamp-1">
            {recipe.title}
          </h3>
          <p className="text-gray-600 mb-3 text-sm line-clamp-2">{recipe.description}</p>
        </Link>

        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(recipe.cookTime)}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span>{recipe.avgRating.toFixed(1)}</span>
            <span className="text-gray-400">({recipe.totalReviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(recipe.difficulty)}`}>
            {difficultyLabel(recipe.difficulty)}
          </span>
          {recipe.smokingWood && (
            <span className="text-xs text-gray-500">🪵 {recipe.smokingWood}</span>
          )}
        </div>

        {/* Author + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${recipe.author.username}`}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              @{recipe.author.username}
            </Link>
            {recipe.author.id && (
              <FollowButton userId={recipe.author.id} size="sm" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <LikeButton recipeId={recipe.id} />
            <ShareButton title={recipe.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { label: 'All', emoji: '🔥' },
  { label: 'Beef', emoji: '🥩' },
  { label: 'Pork', emoji: '🐷' },
  { label: 'Poultry', emoji: '🍗' },
  { label: 'Seafood', emoji: '🦐' },
  { label: 'Wild Game', emoji: '🦌' },
  { label: 'Sides', emoji: '🌽' },
  { label: 'Desserts', emoji: '🍮' },
  { label: 'Other', emoji: '✨' },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);

      const res = await fetch(`/api/recipes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(
          (data.recipes || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            cookTime: r.cookTime,
            servings: r.servings,
            difficulty: r.difficulty,
            avgRating: r.avgRating ?? 0,
            totalReviews: r.totalReviews ?? 0,
            cookingMethod: r.cookingMethod,
            smokingWood: r.smokingWood,
            author: { id: r.author?.id ?? '', username: r.author?.username ?? 'Unknown' },
            primaryImage: r.images?.[0]?.url ?? null,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">BBQ Recipes</h1>
              <p className="text-base sm:text-xl text-gray-600">Discover authentic barbecue recipes from Que-Masters around the world</p>
            </div>
            <Link
              href="/recipes/create"
              className="flex items-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="h-5 w-5" />
              Add Recipe
            </Link>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                selectedCategory === cat.label
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>
        </div>

        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or be the first to add one!</p>
            <Link href="/recipes/create" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium">
              Create First Recipe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
