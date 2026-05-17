'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, Users, Star, ChefHat, Thermometer, TreePine, Printer, Heart, Share2, Flame } from 'lucide-react';
import RecipeReviews from '@/components/RecipeReviews';
import RecipeComments from '@/components/RecipeComments';
import ShareButton from '@/components/ShareButton';
import { initializeSampleReviews } from '@/utils/sampleReviews';

interface RecipeIngredient {
  id: string;
  amount: number;
  unit: string;
  preparation?: string | null;
  optional: boolean;
  section?: string | null;
  order: number;
  ingredient: { id: string; name: string; category: string };
}

interface Instruction {
  id: string;
  stepNumber: number;
  title?: string | null;
  description: string;
  temperature?: number | null;
  time?: number | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
  cookingMethod: string;
  smokingWood?: string | null;
  smokerTemp?: number | null;
  internalTemp?: number | null;
  sauce?: string | null;
  seasoningRub?: string | null;
  avgRating: number;
  totalRatings: number;
  author: { id: string; username: string; image?: string | null };
  ingredients: RecipeIngredient[];
  instructions: Instruction[];
  images: { url: string; isPrimary: boolean }[];
  tags: { tag: { id: string; name: string } }[];
  reviews: { id: string; rating: number; content: string; user: { username: string } }[];
  _count: { favorites: number; reviews: number };
  isPublished: boolean;
  createdAt: string;
}

interface MockRecipe {
  id: string; title: string; description: string;
  cookTime: number; prepTime: number; totalTime: number;
  servings: number; difficulty: string; cookingMethod: string;
  smokingWood?: string; smokerTemp?: number;
  avgRating: number; totalRatings: number;
  author: { id: string; username: string };
  ingredients: string[];
  instructions: string[];
}

// Hardcoded fallback recipes (IDs 1-4) for backward compat
const MOCK_RECIPES: Record<string, MockRecipe> = {
  '1': {
    id: '1',
    title: 'Perfect Smoked Brisket',
    description: 'Low and slow Texas-style brisket with a beautiful bark and tender interior.',
    cookTime: 720, prepTime: 60, totalTime: 780, servings: 8,
    difficulty: 'HARD', cookingMethod: 'SMOKING',
    smokingWood: 'Oak', smokerTemp: 225,
    avgRating: 4.8, totalRatings: 156,
    author: { id: '1', username: 'BBQPitmaster' },
    ingredients: ['1 whole packer brisket (12-15 lbs)', '1/4 cup kosher salt', '1/4 cup coarse black pepper', '2 tbsp garlic powder', '2 tbsp onion powder', 'Oak wood chunks'],
    instructions: ['Trim the brisket fat cap to 1/4 inch.', 'Apply dry rub and refrigerate 12-24 hours.', 'Preheat smoker to 225°F with oak wood.', 'Smoke fat-side down until 165°F internal.', 'Wrap and cook to 203°F internal.', 'Rest 2 hours before slicing.'],
  },
  '2': {
    id: '2',
    title: 'Smoked Pulled Pork',
    description: 'Juicy Boston butt smoked to perfection.',
    cookTime: 480, prepTime: 30, totalTime: 510, servings: 12,
    difficulty: 'MEDIUM', cookingMethod: 'SMOKING',
    smokingWood: 'Apple', smokerTemp: 225,
    avgRating: 4.7, totalRatings: 203,
    author: { id: '2', username: 'SmokeKing' },
    ingredients: ['1 Boston butt (6-8 lbs)', '3 tbsp brown sugar', '2 tbsp paprika', '1 tbsp salt', 'Apple wood chips'],
    instructions: ['Mix dry rub and apply.', 'Preheat smoker to 225°F.', 'Smoke 6-8 hours to 195°F internal.', 'Rest then pull apart.'],
  },
  '3': {
    id: '3',
    title: 'BBQ Chicken Wings',
    description: 'Crispy wings with a sweet and spicy glaze.',
    cookTime: 90, prepTime: 15, totalTime: 105, servings: 4,
    difficulty: 'EASY', cookingMethod: 'SMOKING',
    smokingWood: 'Cherry', smokerTemp: 275,
    avgRating: 4.6, totalRatings: 89,
    author: { id: '3', username: 'WingMaster' },
    ingredients: ['2 lbs chicken wings', '2 tbsp olive oil', '1 tbsp paprika', '1/2 cup BBQ sauce'],
    instructions: ['Toss wings with oil and rub.', 'Smoke at 275°F for 60 minutes.', 'Glaze with BBQ sauce and cook 30 more minutes.'],
  },
  '4': {
    id: '4',
    title: 'Smoked Ribs',
    description: 'Fall-off-the-bone baby back ribs.',
    cookTime: 360, prepTime: 45, totalTime: 405, servings: 6,
    difficulty: 'MEDIUM', cookingMethod: 'SMOKING',
    smokingWood: 'Hickory', smokerTemp: 225,
    avgRating: 4.9, totalRatings: 312,
    author: { id: '4', username: 'RibExpert' },
    ingredients: ['2 racks baby back ribs', '1/4 cup brown sugar', '2 tbsp paprika', 'Hickory wood chunks'],
    instructions: ['Remove membrane from ribs.', 'Apply dry rub generously.', 'Smoke at 225°F for 3 hours.', 'Wrap and cook 2 more hours.', 'Unwrap and cook 1 final hour.'],
  },
};

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function difficultyLabel(d: string) {
  return d.charAt(0) + d.slice(1).toLowerCase();
}

export default function RecipePage() {
  const params = useParams() as { id: string };
  const recipeId = params.id;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [mockRecipe, setMockRecipe] = useState<MockRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Check if it's a hardcoded mock ID first
    if (MOCK_RECIPES[recipeId]) {
      setMockRecipe(MOCK_RECIPES[recipeId]);
      initializeSampleReviews();
      setLoading(false);
      return;
    }

    // Otherwise fetch from database
    fetch(`/api/recipes/${recipeId}`)
      .then(res => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setRecipe(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [recipeId]);

  const getExistingReviews = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`reviews_${recipeId}`);
    return stored ? JSON.parse(stored) : [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (notFound || (!recipe && !mockRecipe)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
          <p className="text-gray-600 mb-6">The recipe you're looking for doesn't exist.</p>
          <Link href="/recipes" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  // ── Render for DB recipe ──────────────────────────────────────────────────
  if (recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/recipes" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Recipes
            </Link>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{recipe.avgRating.toFixed(1)}</span>
                    <span className="ml-1">({recipe._count.reviews} reviews)</span>
                  </div>
                  <Link href={`/profile/${recipe.author.username}`} className="hover:text-orange-600 transition-colors">
                    by {recipe.author.username}
                  </Link>
                </div>
              </div>
              <div className="flex space-x-3 mt-4 lg:mt-0">
                <button className="flex items-center px-3 py-2 text-gray-600 hover:text-orange-600">
                  <Heart className="h-5 w-5 mr-1" />Save
                </button>
                <ShareButton title={recipe.title} />
                <button className="flex items-center px-3 py-2 text-gray-600 hover:text-orange-600">
                  <Printer className="h-5 w-5 mr-1" />Print
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero */}
          {recipe.images?.[0]?.url ? (
            <div className="rounded-lg h-72 overflow-hidden mb-8">
              <img src={recipe.images[0].url} alt={recipe.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg h-64 flex items-center justify-center mb-8">
              <ChefHat className="h-24 w-24 text-white opacity-80" />
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-sm font-medium text-gray-900">Prep Time</div>
                <div className="text-lg font-bold text-orange-600">{formatTime(recipe.prepTime)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-sm font-medium text-gray-900">Cook Time</div>
                <div className="text-lg font-bold text-orange-600">{formatTime(recipe.cookTime)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-sm font-medium text-gray-900">Servings</div>
                <div className="text-lg font-bold text-orange-600">{recipe.servings}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-sm font-medium text-gray-900">Smoker Temp</div>
                <div className="text-lg font-bold text-orange-600">
                  {recipe.smokerTemp ? `${recipe.smokerTemp}°F` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Recipe</h2>
            <p className="text-gray-700 text-lg leading-relaxed">{recipe.description}</p>
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.tags.map(({ tag }) => (
                  <span key={tag.id} className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ingredients */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
                <ul className="space-y-3">
                  {recipe.ingredients
                    .sort((a, b) => a.order - b.order)
                    .map(ing => (
                      <li key={ing.id} className="flex items-start">
                        <input type="checkbox" className="mr-3 mt-1 text-orange-600 focus:ring-orange-500" />
                        <span className="text-gray-700">
                          <span className="font-medium">{ing.amount} {ing.unit}</span>
                          {' '}{ing.ingredient.name}
                          {ing.preparation && <span className="text-gray-500">, {ing.preparation}</span>}
                          {ing.optional && <span className="text-xs text-gray-400 ml-1">(optional)</span>}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructions</h2>
                <ol className="space-y-6">
                  {recipe.instructions.map(step => (
                    <li key={step.id} className="flex items-start">
                      <span className="bg-orange-600 text-white text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
                        {step.stepNumber}
                      </span>
                      <div>
                        {step.title && <p className="font-semibold text-gray-900 mb-1">{step.title}</p>}
                        <p className="text-gray-700 text-lg leading-relaxed">{step.description}</p>
                        {(step.temperature || step.time) && (
                          <div className="flex gap-3 mt-2 text-sm text-orange-700">
                            {step.temperature && <span className="bg-orange-50 px-2 py-1 rounded">{step.temperature}°F</span>}
                            {step.time && <span className="bg-orange-50 px-2 py-1 rounded">{formatTime(step.time)}</span>}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* BBQ Details */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5" /> Recipe Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-orange-800">Difficulty:</span>
                    <span className="ml-2 text-orange-700">{difficultyLabel(recipe.difficulty)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">Method:</span>
                    <span className="ml-2 text-orange-700">{recipe.cookingMethod.replace(/_/g, ' ')}</span>
                  </div>
                  {recipe.smokingWood && (
                    <div>
                      <span className="font-medium text-orange-800">Wood:</span>
                      <span className="ml-2 text-orange-700">{recipe.smokingWood}</span>
                    </div>
                  )}
                  {recipe.internalTemp && (
                    <div>
                      <span className="font-medium text-orange-800">Target Temp:</span>
                      <span className="ml-2 text-orange-700">{recipe.internalTemp}°F</span>
                    </div>
                  )}
                  {recipe.sauce && (
                    <div>
                      <span className="font-medium text-orange-800">Sauce:</span>
                      <span className="ml-2 text-orange-700">{recipe.sauce}</span>
                    </div>
                  )}
                  {recipe.seasoningRub && (
                    <div>
                      <span className="font-medium text-orange-800">Rub:</span>
                      <span className="ml-2 text-orange-700">{recipe.seasoningRub}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-12">
            <RecipeReviews recipeId={recipe.id} existingReviews={[]} />
          </div>

          {/* Comments */}
          <div className="mt-8">
            <RecipeComments recipeId={recipe.id} />
          </div>
        </div>
      </div>
    );
  }

  // ── Render for hardcoded mock recipe (IDs 1-4) ────────────────────────────
  const mock = mockRecipe!;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/recipes" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Recipes
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mock.title}</h1>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{mock.avgRating}</span>
                  <span className="ml-1">({mock.totalRatings} reviews)</span>
                </div>
                <span>by {mock.author?.username}</span>
              </div>
            </div>
            <div className="flex space-x-3 mt-4 lg:mt-0">
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-orange-600">
                <Heart className="h-5 w-5 mr-1" />Save
              </button>
              <ShareButton title={mock.title} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg h-64 flex items-center justify-center mb-8">
          <ChefHat className="h-24 w-24 text-white opacity-80" />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium text-gray-900">Prep Time</div>
              <div className="text-lg font-bold text-orange-600">{formatTime(mock.prepTime || 0)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium text-gray-900">Cook Time</div>
              <div className="text-lg font-bold text-orange-600">{formatTime(mock.cookTime || 0)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium text-gray-900">Servings</div>
              <div className="text-lg font-bold text-orange-600">{mock.servings}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium text-gray-900">Smoker Temp</div>
              <div className="text-lg font-bold text-orange-600">{mock.smokerTemp ? `${mock.smokerTemp}°F` : '—'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Recipe</h2>
          <p className="text-gray-700 text-lg leading-relaxed">{mock.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
              <ul className="space-y-3">
                {(mock.ingredients as string[]).map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <input type="checkbox" className="mr-3 mt-1 text-orange-600 focus:ring-orange-500" />
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructions</h2>
              <ol className="space-y-6">
                {(mock.instructions as string[]).map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-orange-600 text-white text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 text-lg leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-orange-900 mb-4">🔥 Recipe Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-orange-800">Difficulty:</span>
                  <span className="ml-2 text-orange-700">{mock.difficulty ? difficultyLabel(mock.difficulty) : '—'}</span>
                </div>
                {mock.smokingWood && (
                  <div>
                    <span className="font-medium text-orange-800">Wood Type:</span>
                    <span className="ml-2 text-orange-700">{mock.smokingWood}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <RecipeReviews recipeId={recipeId} existingReviews={getExistingReviews()} />
        </div>
        <div className="mt-8">
          <RecipeComments recipeId={recipeId} />
        </div>
      </div>
    </div>
  );
}
