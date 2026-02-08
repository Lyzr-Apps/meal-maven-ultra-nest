'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, X, Plus, ExternalLink, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Leaf, AlertCircle, Carrot, Egg, Wheat, Bean, Flame, Droplets, ShoppingCart, Sunrise, Sun, BarChart3, TrendingUp, Dumbbell, Cherry, Camera, BookOpen, Play, Zap } from 'lucide-react'

// ========== TypeScript Interfaces ==========

interface MealItem {
  name: string
  cuisine_type: string
  source_type: string
  source_name: string
  source_url: string
  calories: number
  protein_grams: number
  carbs_grams: number
  fats_grams: number
  key_ingredients: string[]
  description: string
}

interface DayPlan {
  day: string
  day_number: number
  breakfast: MealItem
  lunch: MealItem
  daily_totals: {
    calories: number
    protein_grams: number
    carbs_grams: number
    fats_grams: number
  }
}

interface ShoppingItem {
  name: string
  quantity: string
  used_in: string[]
}

interface ShoppingCategory {
  category_name: string
  items: ShoppingItem[]
}

interface MealPlanResponse {
  meal_plan: {
    mode: string
    days: DayPlan[]
    weekly_averages: {
      avg_daily_calories: number
      avg_daily_protein: number
      avg_daily_carbs: number
      avg_daily_fats: number
    }
  }
  shopping_list: {
    categories: ShoppingCategory[]
    total_items: number
  }
  nutrition_summary: {
    weekly_totals: {
      total_calories: number
      total_protein: number
      total_carbs: number
      total_fats: number
    }
    daily_averages: {
      avg_calories: number
      avg_protein: number
      avg_carbs: number
      avg_fats: number
    }
    macro_split: {
      protein_percentage: number
      carbs_percentage: number
      fats_percentage: number
    }
  }
}

// ========== Agent Info ==========

const MANAGER_AGENT_ID = '6988bf3a6f6e7c67fe7e8b53'

const AGENTS = [
  { id: '6988bf3a6f6e7c67fe7e8b53', name: 'Meal Planning Coordinator', purpose: 'Orchestrates the workflow' },
  { id: '6988bea74b8f2695557f93f0', name: 'Recipe Research Agent', purpose: 'Searches Indian recipes' },
  { id: '6988bedc4b8f2695557f93f1', name: 'Meal Curator Agent', purpose: 'Curates 6-day plans' },
  { id: '6988bf0f941252c267af72b5', name: 'Output Formatter Agent', purpose: 'Formats output data' },
]

// ========== Sample Data ==========

const SAMPLE_DATA: MealPlanResponse = {
  meal_plan: {
    mode: 'Protein-Focused',
    days: [
      { day: 'Monday', day_number: 1, breakfast: { name: 'Egg Vegetable Dosa', cuisine_type: 'South Indian', source_type: 'Instagram', source_name: 'fit_khurana', source_url: 'https://www.instagram.com/p/protein_dosa_variations', calories: 385, protein_grams: 22, carbs_grams: 42, fats_grams: 14, key_ingredients: ['dosa batter', 'eggs', 'mixed vegetables', 'onions', 'tomatoes'], description: 'Crispy South Indian dosa topped with scrambled eggs and colorful vegetables' }, lunch: { name: 'Palak Paneer with Brown Rice', cuisine_type: 'North Indian', source_type: 'Blog', source_name: "Hebbar's Kitchen", source_url: 'https://hebbarskitchen.com/palak-paneer-recipe', calories: 485, protein_grams: 26, carbs_grams: 52, fats_grams: 18, key_ingredients: ['paneer', 'spinach', 'tomatoes', 'cream', 'brown rice'], description: 'Creamy spinach curry with cottage cheese cubes served with fiber-rich brown rice' }, daily_totals: { calories: 870, protein_grams: 48, carbs_grams: 94, fats_grams: 32 } },
      { day: 'Tuesday', day_number: 2, breakfast: { name: 'Paneer Upma', cuisine_type: 'South Indian', source_type: 'Instagram', source_name: 'diningwithdhoot', source_url: 'https://www.instagram.com/p/high_protein_upma', calories: 395, protein_grams: 24, carbs_grams: 45, fats_grams: 13, key_ingredients: ['semolina', 'paneer', 'vegetables', 'curry leaves', 'mustard seeds'], description: 'Traditional South Indian semolina breakfast with protein-rich paneer' }, lunch: { name: 'Vegetable Hakka Noodles with Paneer', cuisine_type: 'Continental', source_type: 'Instagram', source_name: 'fit_khurana', source_url: 'https://www.instagram.com/p/protein_noodles', calories: 465, protein_grams: 22, carbs_grams: 58, fats_grams: 16, key_ingredients: ['hakka noodles', 'paneer', 'bell peppers', 'cabbage', 'soy sauce'], description: 'Indo-Chinese fusion noodles loaded with paneer and vegetables' }, daily_totals: { calories: 860, protein_grams: 46, carbs_grams: 103, fats_grams: 29 } },
      { day: 'Wednesday', day_number: 3, breakfast: { name: 'Cheese Stuffed Idli', cuisine_type: 'South Indian', source_type: 'Instagram', source_name: "harry's_kitchen", source_url: 'https://www.instagram.com/p/cheese_idli_protein', calories: 405, protein_grams: 23, carbs_grams: 48, fats_grams: 14, key_ingredients: ['idli batter', 'mozzarella cheese', 'coriander', 'green chillies'], description: 'Soft steamed rice cakes stuffed with melted cheese' }, lunch: { name: 'Chana Masala with Jeera Rice', cuisine_type: 'North Indian', source_type: 'Blog', source_name: 'Indian Healthy Recipes', source_url: 'https://www.indianhealthyrecipes.com/chana-masala', calories: 475, protein_grams: 24, carbs_grams: 64, fats_grams: 12, key_ingredients: ['chickpeas', 'tomatoes', 'onions', 'garam masala', 'basmati rice'], description: 'Protein-packed chickpea curry in spiced tomato gravy with cumin rice' }, daily_totals: { calories: 880, protein_grams: 47, carbs_grams: 112, fats_grams: 26 } },
      { day: 'Thursday', day_number: 4, breakfast: { name: 'Masala Dosa with Egg', cuisine_type: 'South Indian', source_type: 'Instagram', source_name: 'saransh_goila', source_url: 'https://www.instagram.com/p/egg_masala_dosa', calories: 420, protein_grams: 24, carbs_grams: 51, fats_grams: 15, key_ingredients: ['dosa batter', 'potato masala', 'eggs', 'onions', 'spices'], description: 'Classic crispy masala dosa enhanced with protein-rich egg layer' }, lunch: { name: 'Vegetable Biryani with Raita', cuisine_type: 'North Indian', source_type: 'YouTube', source_name: "Hebbar's Kitchen", source_url: 'https://hebbarskitchen.com/vegetable-biryani-recipe', calories: 495, protein_grams: 21, carbs_grams: 72, fats_grams: 14, key_ingredients: ['basmati rice', 'mixed vegetables', 'yogurt', 'biryani spices', 'saffron'], description: 'Fragrant layered rice dish with mixed vegetables and aromatic spices' }, daily_totals: { calories: 915, protein_grams: 45, carbs_grams: 123, fats_grams: 29 } },
      { day: 'Friday', day_number: 5, breakfast: { name: 'Egg Bhurji with Whole Wheat Toast', cuisine_type: 'South Indian', source_type: 'Blog', source_name: 'Indian Healthy Recipes', source_url: 'https://www.indianhealthyrecipes.com/egg-bhurji', calories: 390, protein_grams: 26, carbs_grams: 38, fats_grams: 15, key_ingredients: ['eggs', 'onions', 'tomatoes', 'green chillies', 'whole wheat bread'], description: 'Spiced scrambled eggs with onions and tomatoes, served with toast' }, lunch: { name: 'Paneer Butter Masala with Roti', cuisine_type: 'North Indian', source_type: 'Instagram', source_name: 'omkar_pawar', source_url: 'https://www.instagram.com/p/paneer_butter_masala_protein', calories: 505, protein_grams: 28, carbs_grams: 48, fats_grams: 22, key_ingredients: ['paneer', 'tomatoes', 'cream', 'butter', 'whole wheat roti'], description: 'Rich and creamy cottage cheese curry in buttery tomato sauce' }, daily_totals: { calories: 895, protein_grams: 54, carbs_grams: 86, fats_grams: 37 } },
      { day: 'Saturday', day_number: 6, breakfast: { name: 'Paneer Tikka Paratha', cuisine_type: 'South Indian', source_type: 'Instagram', source_name: 'fit_khurana', source_url: 'https://www.instagram.com/p/paneer_tikka_paratha', calories: 435, protein_grams: 25, carbs_grams: 46, fats_grams: 17, key_ingredients: ['whole wheat flour', 'paneer tikka', 'yogurt', 'tandoori spices'], description: 'Stuffed flatbread filled with marinated paneer tikka' }, lunch: { name: 'Palak Paneer with Quinoa', cuisine_type: 'North Indian', source_type: 'Blog', source_name: "Hebbar's Kitchen", source_url: 'https://hebbarskitchen.com/palak-paneer-healthy', calories: 470, protein_grams: 27, carbs_grams: 49, fats_grams: 17, key_ingredients: ['paneer', 'spinach', 'quinoa', 'garlic', 'cream'], description: 'Classic spinach-paneer curry served with protein-rich quinoa' }, daily_totals: { calories: 905, protein_grams: 52, carbs_grams: 95, fats_grams: 34 } },
    ],
    weekly_averages: { avg_daily_calories: 888, avg_daily_protein: 49, avg_daily_carbs: 102, avg_daily_fats: 31 },
  },
  shopping_list: {
    categories: [
      { category_name: 'Vegetables', items: [{ name: 'Spinach (Palak)', quantity: '1.8 kg', used_in: ['Palak Paneer with Brown Rice', 'Palak Paneer with Quinoa'] }, { name: 'Onions', quantity: '1.2 kg', used_in: ['Egg Vegetable Dosa', 'Masala Dosa with Egg', 'Egg Bhurji'] }, { name: 'Tomatoes', quantity: '1.5 kg', used_in: ['Egg Vegetable Dosa', 'Chana Masala', 'Paneer Butter Masala'] }] },
      { category_name: 'Dairy & Eggs', items: [{ name: 'Paneer', quantity: '1.45 kg', used_in: ['Paneer Upma', 'Paneer Tikka Paratha', 'Palak Paneer'] }, { name: 'Eggs', quantity: '15 pcs', used_in: ['Egg Vegetable Dosa', 'Masala Dosa with Egg', 'Egg Bhurji'] }, { name: 'Cheese', quantity: '120 g', used_in: ['Cheese Stuffed Idli'] }] },
      { category_name: 'Grains & Flour', items: [{ name: 'Dosa Batter', quantity: '600 g', used_in: ['Egg Vegetable Dosa', 'Masala Dosa with Egg'] }, { name: 'Whole Wheat Flour', quantity: '450 g', used_in: ['Paneer Tikka Paratha', 'Roti'] }, { name: 'Basmati Rice', quantity: '450 g', used_in: ['Chana Masala with Jeera Rice', 'Vegetable Biryani'] }] },
      { category_name: 'Spices & Condiments', items: [{ name: 'Cumin Seeds', quantity: '30 g', used_in: ['Paneer Upma', 'Palak Paneer', 'Jeera Rice'] }, { name: 'Garam Masala', quantity: '18 g', used_in: ['Vegetable Biryani', 'Paneer Butter Masala'] }] },
    ],
    total_items: 43,
  },
  nutrition_summary: {
    weekly_totals: { total_calories: 14100, total_protein: 740, total_carbs: 1850, total_fats: 510 },
    daily_averages: { avg_calories: 2350, avg_protein: 123, avg_carbs: 308, avg_fats: 85 },
    macro_split: { protein_percentage: 21, carbs_percentage: 52, fats_percentage: 27 },
  },
}

// ========== Response Parser ==========

const parseAgentResponse = (result: unknown): MealPlanResponse | null => {
  try {
    const res = result as Record<string, unknown> | null | undefined
    let data = (res as Record<string, Record<string, unknown>> | undefined)?.response?.result as Record<string, unknown> | string | undefined

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data) as Record<string, unknown>
      } catch {
        const jsonMatch = (data as string).match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[1]) as Record<string, unknown>
        }
      }
    }

    if (data && typeof data === 'object' && !(data as Record<string, unknown>).meal_plan) {
      const possibleKeys = ['result', 'response', 'data', 'output', 'content']
      for (const key of possibleKeys) {
        const val = (data as Record<string, unknown>)[key]
        if (val && typeof val === 'object' && (val as Record<string, unknown>).meal_plan) {
          data = val as Record<string, unknown>
          break
        }
        if (val && typeof val === 'string') {
          try {
            const parsed = JSON.parse(val) as Record<string, unknown>
            if (parsed.meal_plan) {
              data = parsed
              break
            }
          } catch { /* skip */ }
        }
      }
    }

    if ((!data || typeof data !== 'object' || !(data as Record<string, unknown>).meal_plan) && res?.raw_response) {
      try {
        const rawParsed = JSON.parse(res.raw_response as string) as Record<string, unknown>
        if (rawParsed.meal_plan) data = rawParsed
      } catch {
        const jsonMatch = (res.raw_response as string).match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>
            if (parsed.meal_plan) data = parsed
          } catch { /* skip */ }
        }
      }
    }

    if (data && typeof data === 'object' && (data as Record<string, unknown>).meal_plan) return data as unknown as MealPlanResponse
    return null
  } catch {
    return null
  }
}

// ========== Loading Messages ==========

const LOADING_MESSAGES = [
  'Researching recipes from Indian creators...',
  'Curating your personalized meal plan...',
  'Balancing nutrition across the week...',
  'Generating shopping list and nutrition data...',
]

// ========== Category Icons ==========

function CategoryIcon({ category }: { category: string }) {
  const lower = category.toLowerCase()
  if (lower.includes('vegetable')) return <Carrot className="h-5 w-5 text-orange-500" />
  if (lower.includes('dairy') || lower.includes('egg')) return <Egg className="h-5 w-5 text-yellow-600" />
  if (lower.includes('grain') || lower.includes('flour')) return <Wheat className="h-5 w-5 text-amber-600" />
  if (lower.includes('lentil') || lower.includes('legume')) return <Bean className="h-5 w-5 text-emerald-700" />
  if (lower.includes('spice') || lower.includes('condiment')) return <Flame className="h-5 w-5 text-red-500" />
  if (lower.includes('oil') || lower.includes('fat')) return <Droplets className="h-5 w-5 text-sky-500" />
  if (lower.includes('fruit')) return <Cherry className="h-5 w-5 text-pink-500" />
  return <ShoppingCart className="h-5 w-5 text-muted-foreground" />
}

// ========== Source Icon ==========

function SourceIcon({ type }: { type: string }) {
  const lower = (type ?? '').toLowerCase()
  if (lower === 'youtube') return <Play className="h-3.5 w-3.5 text-red-500" />
  if (lower === 'instagram') return <Camera className="h-3.5 w-3.5 text-pink-500" />
  return <BookOpen className="h-3.5 w-3.5 text-blue-500" />
}

// ========== Cuisine Badge ==========

function CuisineBadge({ cuisine }: { cuisine: string }) {
  const lower = (cuisine ?? '').toLowerCase()
  if (lower.includes('south')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">South Indian</span>
  }
  if (lower.includes('north')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">North Indian</span>
  }
  if (lower.includes('continental') || lower.includes('indo')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Continental</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{cuisine}</span>
}

// ========== Macro Pill ==========

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}: {value ?? 0}{unit}
    </span>
  )
}

// ========== Meal Card ==========

function MealCard({ meal }: { meal: MealItem | undefined | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!meal) return null

  return (
    <div className="rounded-xl border border-white/20 p-3 backdrop-blur-md bg-white/60 hover:bg-white/80 transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-tight text-foreground">{meal.name ?? 'Untitled'}</h4>
        {meal.source_url && (
          <a href={meal.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <CuisineBadge cuisine={meal.cuisine_type ?? ''} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <SourceIcon type={meal.source_type ?? ''} />
          <span className="truncate max-w-[80px]">{meal.source_name ?? ''}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-1">
        <MacroPill label="P" value={meal.protein_grams ?? 0} unit="g" color="bg-green-100 text-green-700" />
        <MacroPill label="C" value={meal.carbs_grams ?? 0} unit="g" color="bg-amber-100 text-amber-700" />
        <MacroPill label="F" value={meal.fats_grams ?? 0} unit="g" color="bg-rose-100 text-rose-700" />
        <MacroPill label="Cal" value={meal.calories ?? 0} unit="" color="bg-blue-100 text-blue-700" />
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">{meal.description ?? ''}</p>
          {Array.isArray(meal.key_ingredients) && meal.key_ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meal.key_ingredients.map((ing, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ing}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ========== Macro Bar ==========

function MacroBar({ proteinPct, carbsPct, fatsPct }: { proteinPct: number; carbsPct: number; fatsPct: number }) {
  return (
    <div className="w-full">
      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
        <div className="bg-green-500 transition-all duration-500 flex items-center justify-center" style={{ width: `${proteinPct ?? 0}%` }}>
          {(proteinPct ?? 0) > 10 && <span className="text-[10px] text-white font-bold">{proteinPct}%</span>}
        </div>
        <div className="bg-amber-400 transition-all duration-500 flex items-center justify-center" style={{ width: `${carbsPct ?? 0}%` }}>
          {(carbsPct ?? 0) > 10 && <span className="text-[10px] text-white font-bold">{carbsPct}%</span>}
        </div>
        <div className="bg-rose-400 transition-all duration-500 flex items-center justify-center" style={{ width: `${fatsPct ?? 0}%` }}>
          {(fatsPct ?? 0) > 10 && <span className="text-[10px] text-white font-bold">{fatsPct}%</span>}
        </div>
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Protein {proteinPct ?? 0}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Carbs {carbsPct ?? 0}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Fats {fatsPct ?? 0}%</span>
      </div>
    </div>
  )
}

// ========== Stat Card ==========

function StatCard({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 p-4 flex flex-col items-center gap-1 min-w-[120px]">
      <div className="text-primary mb-1">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value ?? 0}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// ========== Main Page Component ==========

export default function Home() {
  // State
  const [mode, setMode] = useState<'regular' | 'protein'>('regular')
  const [ingredientInput, setIngredientInput] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [mealPlanData, setMealPlanData] = useState<MealPlanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [showSampleData, setShowSampleData] = useState(false)
  const [shoppingListOpen, setShoppingListOpen] = useState(false)
  const [copiedList, setCopiedList] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Computed data source
  const displayData = showSampleData && !mealPlanData ? SAMPLE_DATA : mealPlanData

  // Loading message cycling
  useEffect(() => {
    if (loading) {
      setLoadingMsgIdx(0)
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length)
      }, 3500)
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
    }
  }, [loading])

  // Add ingredient
  const addIngredient = useCallback(() => {
    const trimmed = ingredientInput.trim()
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients((prev) => [...prev, trimmed])
      setIngredientInput('')
    }
  }, [ingredientInput, ingredients])

  // Remove ingredient
  const removeIngredient = useCallback((ing: string) => {
    setIngredients((prev) => prev.filter((i) => i !== ing))
  }, [])

  // Generate meal plan
  const generateMealPlan = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatusMsg(null)
    setActiveAgentId(MANAGER_AGENT_ID)
    setShowSampleData(false)

    try {
      const modeLabel = mode === 'protein' ? 'Protein-Focused' : 'Regular Balanced'
      const message = `Generate a 6-day ${modeLabel} meal plan for Indian vegetarian/eggetarian cuisine.${ingredients.length > 0 ? ` Include these ingredients: ${ingredients.join(', ')}.` : ''} Focus on South Indian breakfast recipes with variety from North Indian and Continental dishes for lunch. Provide complete nutritional breakdown and shopping list.`

      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      if (result.success) {
        const parsed = parseAgentResponse(result)
        if (parsed) {
          setMealPlanData(parsed)
          setStatusMsg('Meal plan generated successfully!')
        } else {
          setError('Could not parse meal plan from response. Please try again.')
        }
      } else {
        setError(result.error ?? 'Failed to generate meal plan. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [mode, ingredients])

  // Copy shopping list
  const handleCopyShoppingList = useCallback(async () => {
    if (!displayData?.shopping_list) return
    const categories = Array.isArray(displayData.shopping_list.categories) ? displayData.shopping_list.categories : []
    const lines: string[] = ['Shopping List - MealCraft India', '']
    categories.forEach((cat) => {
      lines.push(`--- ${cat.category_name ?? 'Uncategorized'} ---`)
      const items = Array.isArray(cat.items) ? cat.items : []
      items.forEach((item) => {
        const usedInText = Array.isArray(item.used_in) ? ` (used in: ${item.used_in.join(', ')})` : ''
        lines.push(`  ${item.name ?? 'Item'} - ${item.quantity ?? ''}${usedInText}`)
      })
      lines.push('')
    })
    const success = await copyToClipboard(lines.join('\n'))
    if (success) {
      setCopiedList(true)
      setTimeout(() => setCopiedList(false), 2000)
    }
  }, [displayData])

  // Derived data
  const days = displayData?.meal_plan?.days
  const safeDays = Array.isArray(days) ? days : []
  const nutritionSummary = displayData?.nutrition_summary
  const macroSplit = nutritionSummary?.macro_split
  const shoppingCategories = Array.isArray(displayData?.shopping_list?.categories) ? displayData.shopping_list.categories : []

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(120 25% 96%) 0%, hsl(140 30% 94%) 35%, hsl(160 25% 95%) 70%, hsl(100 20% 96%) 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ===== HEADER ===== */}
        <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 p-6 sm:p-8" style={{ borderRadius: '0.875rem' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Leaf className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">MealCraft India</h1>
                <p className="text-sm text-muted-foreground">Smart South Indian Meal Planning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-sm text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={(checked) => setShowSampleData(checked)} />
            </div>
          </div>
        </div>

        {/* ===== PREFERENCE CONTROLS ===== */}
        <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 p-6" style={{ borderRadius: '0.875rem' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Plan Your Meals</h2>
          <p className="text-sm text-muted-foreground mb-5">Choose your meal mode and optionally specify ingredients. We will curate a 6-day plan with South Indian breakfasts and diverse lunches.</p>

          {/* Mode Toggle */}
          <div className="mb-5">
            <label className="text-sm font-medium text-foreground mb-2 block">Meal Mode</label>
            <div className="inline-flex rounded-xl bg-secondary p-1 gap-0">
              <button type="button" onClick={() => setMode('regular')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'regular' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-secondary-foreground hover:bg-muted'}`}>
                Regular Balanced
              </button>
              <button type="button" onClick={() => setMode('protein')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'protein' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-secondary-foreground hover:bg-muted'}`}>
                Protein-Focused
              </button>
            </div>
          </div>

          {/* Ingredient Input */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Include Ingredients (optional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add ingredients to include (e.g., paneer, spinach, eggs)"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient() } }}
                className="flex-1 bg-white/70 border-border/50"
              />
              <Button variant="outline" size="icon" onClick={addIngredient} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ingredient Chips */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {ingredients.map((ing) => (
                <Badge key={ing} variant="secondary" className="pl-3 pr-1 py-1 gap-1 text-sm">
                  {ing}
                  <button type="button" onClick={() => removeIngredient(ing)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Generate Button */}
          <Button onClick={generateMealPlan} disabled={loading} size="lg" className="w-full sm:w-auto text-base font-semibold px-8 py-3 shadow-md hover:shadow-lg transition-all">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {LOADING_MESSAGES[loadingMsgIdx]}
              </>
            ) : (
              <>
                <Leaf className="h-5 w-5 mr-2" />
                Generate Meal Plan
              </>
            )}
          </Button>

          {/* Status / Error Messages */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {statusMsg && !error && (
            <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-primary">{statusMsg}</p>
            </div>
          )}
        </div>

        {/* ===== EMPTY STATE ===== */}
        {!displayData && !loading && (
          <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 p-12 text-center" style={{ borderRadius: '0.875rem' }}>
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-9 w-9 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Your meal plan awaits</h3>
              <p className="text-sm text-muted-foreground">Choose your preferences above and click "Generate Meal Plan" to receive a curated 6-day Indian meal plan with complete nutrition data and a shopping list. Toggle "Sample Data" to preview the interface.</p>
            </div>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {loading && (
          <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 p-12 text-center" style={{ borderRadius: '0.875rem' }}>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            <p className="text-sm text-muted-foreground">This may take a moment as our agents research real recipes</p>
          </div>
        )}

        {/* ===== MEAL PLAN GRID ===== */}
        {displayData && !loading && (
          <>
            {/* Plan Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Your 6-Day Meal Plan</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Mode: <Badge variant="secondary" className="ml-1">{displayData.meal_plan?.mode ?? 'Regular'}</Badge>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={generateMealPlan} disabled={loading} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            </div>

            {/* Breakfast Row */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sunrise className="h-5 w-5 text-amber-500" /> Breakfast
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {safeDays.map((day) => (
                  <div key={`bf-${day.day_number ?? day.day}`}>
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5 px-1">{day.day ?? `Day ${day.day_number}`}</div>
                    <MealCard meal={day.breakfast} />
                  </div>
                ))}
              </div>
            </div>

            {/* Lunch Row */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" /> Lunch
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {safeDays.map((day) => (
                  <div key={`ln-${day.day_number ?? day.day}`}>
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5 px-1">{day.day ?? `Day ${day.day_number}`}</div>
                    <MealCard meal={day.lunch} />
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Totals Row */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Daily Totals
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {safeDays.map((day) => (
                  <div key={`dt-${day.day_number ?? day.day}`} className="rounded-xl border border-white/20 backdrop-blur-md bg-white/50 p-3">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{day.day ?? `Day ${day.day_number}`}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Calories</span><span className="font-semibold">{day.daily_totals?.calories ?? 0}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Protein</span><span className="font-semibold text-green-600">{day.daily_totals?.protein_grams ?? 0}g</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Carbs</span><span className="font-semibold text-amber-600">{day.daily_totals?.carbs_grams ?? 0}g</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Fats</span><span className="font-semibold text-rose-500">{day.daily_totals?.fats_grams ?? 0}g</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== NUTRITION SUMMARY ===== */}
            {nutritionSummary && (
              <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 p-6" style={{ borderRadius: '0.875rem' }}>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Nutrition Summary
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Avg Daily Calories" value={nutritionSummary.daily_averages?.avg_calories ?? 0} unit="kcal" icon={<Zap className="h-6 w-6 text-orange-500" />} />
                  <StatCard label="Avg Daily Protein" value={nutritionSummary.daily_averages?.avg_protein ?? 0} unit="g" icon={<Dumbbell className="h-6 w-6 text-green-600" />} />
                  <StatCard label="Avg Daily Carbs" value={nutritionSummary.daily_averages?.avg_carbs ?? 0} unit="g" icon={<Wheat className="h-6 w-6 text-amber-600" />} />
                  <StatCard label="Avg Daily Fats" value={nutritionSummary.daily_averages?.avg_fats ?? 0} unit="g" icon={<Droplets className="h-6 w-6 text-rose-500" />} />
                </div>

                <div className="max-w-lg mx-auto">
                  <h3 className="text-sm font-medium text-foreground mb-3 text-center">Macro Split</h3>
                  <MacroBar proteinPct={macroSplit?.protein_percentage ?? 0} carbsPct={macroSplit?.carbs_percentage ?? 0} fatsPct={macroSplit?.fats_percentage ?? 0} />
                </div>

                {nutritionSummary.weekly_totals && (
                  <div className="mt-6 pt-4 border-t border-border/40">
                    <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
                      <span>Weekly Calories: <strong className="text-foreground">{nutritionSummary.weekly_totals.total_calories?.toLocaleString() ?? 0}</strong></span>
                      <span>Weekly Protein: <strong className="text-foreground">{nutritionSummary.weekly_totals.total_protein ?? 0}g</strong></span>
                      <span>Weekly Carbs: <strong className="text-foreground">{nutritionSummary.weekly_totals.total_carbs ?? 0}g</strong></span>
                      <span>Weekly Fats: <strong className="text-foreground">{nutritionSummary.weekly_totals.total_fats ?? 0}g</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== SHOPPING LIST ===== */}
            <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/60 overflow-hidden" style={{ borderRadius: '0.875rem' }}>
              <button type="button" onClick={() => setShoppingListOpen(!shoppingListOpen)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Shopping List</h2>
                    <p className="text-sm text-muted-foreground">{displayData.shopping_list?.total_items ?? shoppingCategories.reduce((sum, cat) => sum + (Array.isArray(cat.items) ? cat.items.length : 0), 0)} items across {shoppingCategories.length} categories</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCopyShoppingList() }} className="gap-1.5">
                    {copiedList ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedList ? 'Copied!' : 'Copy List'}
                  </Button>
                  {shoppingListOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>
              </button>

              {shoppingListOpen && (
                <div className="px-6 pb-6">
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shoppingCategories.map((cat, catIdx) => (
                      <Card key={catIdx} className="bg-white/50 border-border/30">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CategoryIcon category={cat.category_name ?? ''} />
                            {cat.category_name ?? 'Uncategorized'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <div className="space-y-2">
                            {Array.isArray(cat.items) && cat.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">{item.name ?? 'Item'}</div>
                                  {Array.isArray(item.used_in) && item.used_in.length > 0 && (
                                    <div className="text-[10px] text-muted-foreground truncate">Used in: {item.used_in.join(', ')}</div>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-primary whitespace-nowrap">{item.quantity ?? ''}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== AGENT STATUS ===== */}
        <div className="rounded-xl border border-white/20 backdrop-blur-md bg-white/40 p-4" style={{ borderRadius: '0.875rem' }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Powered by AI Agents</h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2 text-xs">
                <span className={`h-2 w-2 rounded-full shrink-0 ${activeAgentId === agent.id ? 'bg-amber-400 animate-pulse' : 'bg-primary/60'}`} />
                <span className="font-medium text-foreground">{agent.name}</span>
                <span className="text-muted-foreground hidden sm:inline">- {agent.purpose}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
