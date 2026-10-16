export type GoalType = 'cut' | 'maintain' | 'bulk';

export type FoodCategory =
  | 'Protein'
  | 'Carbs'
  | 'Fats'
  | 'Fruits'
  | 'Vegetables'
  | 'Dairy'
  | 'Snacks'
  | 'Drinks'
  | 'Custom';

export interface MealSlot {
  id: string;
  name: string; // e.g. "Breakfast", "Morning Snack", "Lunch", "Pre-Workout", "Dinner"
  time: string; // e.g. "08:00 AM"
  targetCalories?: number; // Target calorie allocation
  order: number;
  enabled: boolean;
  iconName?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  servingSize: string; // e.g. "100g", "1 whole (50g)", "1 scoop (30g)"
  servingWeightGrams?: number;
  calories: number; // kcal
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface LoggedMealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealSlotId: string;
  foodItemId?: string;
  name: string;
  portion: number; // Multiplier, e.g. 1.0, 1.5, 2.0
  servingUnit: string; // e.g. "serving", "100g", "piece"
  calories: number; // calculated calories for this portion
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  notes?: string;
  createdAt: string;
}

export interface NutritionGoals {
  calorieTarget: number; // e.g. 2100
  maintenanceCalories: number; // e.g. 2450
  goalType: GoalType; // 'cut' | 'maintain' | 'bulk'
  targetDeficit: number; // e.g. 350 kcal deficit or -200 for surplus
  proteinTarget: number; // grams, e.g. 145
  carbsTarget: number; // grams, e.g. 210
  fatTarget: number; // grams, e.g. 55
  fiberTarget?: number; // grams, e.g. 30
  waterTargetMl: number; // ml, e.g. 3000
}

export interface DailyHabitLog {
  date: string; // YYYY-MM-DD
  waterIntakeMl: number;
  stuckToDiet: boolean;
  noJunkFood: boolean;
  supplementsTaken: boolean;
  notes?: string;
}

export interface DayNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  waterIntakeMl: number;
  calorieTarget: number;
  remainingCalories: number;
  deficitVsMaintenance: number; // maintenance - totalCalories (positive = deficit)
  deficitVsTarget: number; // calorieTarget - totalCalories
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  macroPercentages: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
  deficiencies: NutritionDeficiencyAlert[];
}

export interface NutritionDeficiencyAlert {
  type: 'protein' | 'calories' | 'hydration' | 'carbs' | 'fat' | 'success';
  severity: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  shortfallGrams?: number;
}

export type NutritionAnalyticsPeriod = 'day' | 'week' | 'month' | 'custom';
