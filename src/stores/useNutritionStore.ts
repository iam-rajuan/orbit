import { create } from 'zustand';
import {
  MealSlot,
  FoodItem,
  LoggedMealEntry,
  NutritionGoals,
  DailyHabitLog,
  DayNutritionSummary,
  NutritionDeficiencyAlert,
} from '../types/nutrition';
import { nutritionRepository } from '../services/repositories/nutritionRepository';

interface NutritionState {
  mealSlots: MealSlot[];
  loggedEntries: LoggedMealEntry[];
  foodLibrary: FoodItem[];
  goals: NutritionGoals;
  habits: Record<string, DailyHabitLog>;
  isLoading: boolean;

  // Actions
  loadNutrition: () => Promise<void>;
  addLoggedEntry: (entry: Omit<LoggedMealEntry, 'id' | 'createdAt'>) => Promise<LoggedMealEntry>;
  updateLoggedEntry: (entry: LoggedMealEntry) => Promise<void>;
  deleteLoggedEntry: (id: string) => Promise<void>;
  copyMealsFromDate: (sourceDate: string, targetDate: string) => Promise<void>;

  // Meal Slots / Routine actions
  addMealSlot: (slot: Omit<MealSlot, 'id' | 'order'>) => Promise<void>;
  updateMealSlot: (slot: MealSlot) => Promise<void>;
  deleteMealSlot: (id: string) => Promise<void>;
  reorderMealSlots: (slots: MealSlot[]) => Promise<void>;

  // Custom Food
  addCustomFood: (food: Omit<FoodItem, 'id'>) => Promise<FoodItem>;

  // Goals
  updateGoals: (goals: NutritionGoals) => Promise<void>;

  // Water & Habits
  logWater: (date: string, deltaMl: number) => Promise<void>;
  toggleHabit: (date: string, key: 'stuckToDiet' | 'noJunkFood' | 'supplementsTaken') => Promise<void>;
  updateHabitNotes: (date: string, notes: string) => Promise<void>;

  // Getters / Computed analytics
  getDayTotals: (date: string) => DayNutritionSummary;
  getPeriodAnalytics: (startDate: string, endDate: string) => {
    days: {
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      water: number;
      calorieTarget: number;
      deficit: number;
    }[];
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    avgWater: number;
    totalDeficit: number;
    estimatedKgFatLoss: number;
    adherenceRatePct: number;
    highestCalorieDay: { date: string; calories: number } | null;
    lowestCalorieDay: { date: string; calories: number } | null;
  };
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  mealSlots: [],
  loggedEntries: [],
  foodLibrary: [],
  goals: {
    calorieTarget: 2100,
    maintenanceCalories: 2450,
    goalType: 'cut',
    targetDeficit: 350,
    proteinTarget: 145,
    carbsTarget: 210,
    fatTarget: 55,
    fiberTarget: 30,
    waterTargetMl: 3000,
  },
  habits: {},
  isLoading: false,

  loadNutrition: async () => {
    set({ isLoading: true });
    try {
      const [mealSlots, loggedEntries, foodLibrary, goals, habits] = await Promise.all([
        nutritionRepository.getMealSlots(),
        nutritionRepository.getAllEntries(),
        nutritionRepository.getFoodLibrary(),
        nutritionRepository.getGoals(),
        nutritionRepository.getAllHabits(),
      ]);

      set({
        mealSlots: mealSlots.sort((a, b) => a.order - b.order),
        loggedEntries,
        foodLibrary,
        goals,
        habits,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to load nutrition data:', e);
      set({ isLoading: false });
    }
  },

  addLoggedEntry: async (entryData) => {
    const newEntry: LoggedMealEntry = {
      ...entryData,
      id: `meal_entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const { loggedEntries } = get();
    const updated = [...loggedEntries, newEntry];
    set({ loggedEntries: updated });

    await nutritionRepository.addEntry(newEntry);
    return newEntry;
  },

  updateLoggedEntry: async (entry) => {
    const { loggedEntries } = get();
    const updated = loggedEntries.map((e) => (e.id === entry.id ? entry : e));
    set({ loggedEntries: updated });
    await nutritionRepository.updateEntry(entry);
  },

  deleteLoggedEntry: async (id) => {
    const { loggedEntries } = get();
    const updated = loggedEntries.filter((e) => e.id !== id);
    set({ loggedEntries: updated });
    await nutritionRepository.deleteEntry(id);
  },

  copyMealsFromDate: async (sourceDate, targetDate) => {
    const { loggedEntries } = get();
    const sourceEntries = loggedEntries.filter((e) => e.date === sourceDate);
    if (sourceEntries.length === 0) return;

    const cloned = sourceEntries.map((e) => ({
      ...e,
      id: `meal_entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: targetDate,
      createdAt: new Date().toISOString(),
    }));

    const updated = [...loggedEntries, ...cloned];
    set({ loggedEntries: updated });
    await nutritionRepository.saveAllEntries(updated);
  },

  addMealSlot: async (slotData) => {
    const { mealSlots } = get();
    const maxOrder = mealSlots.reduce((max, s) => Math.max(max, s.order), 0);
    const newSlot: MealSlot = {
      ...slotData,
      id: `slot_${Date.now()}`,
      order: maxOrder + 1,
    };
    const updated = [...mealSlots, newSlot].sort((a, b) => a.order - b.order);
    set({ mealSlots: updated });
    await nutritionRepository.saveMealSlots(updated);
  },

  updateMealSlot: async (slot) => {
    const { mealSlots } = get();
    const updated = mealSlots.map((s) => (s.id === slot.id ? slot : s));
    set({ mealSlots: updated });
    await nutritionRepository.saveMealSlots(updated);
  },

  deleteMealSlot: async (id) => {
    const { mealSlots } = get();
    const updated = mealSlots.filter((s) => s.id !== id);
    set({ mealSlots: updated });
    await nutritionRepository.saveMealSlots(updated);
  },

  reorderMealSlots: async (slots) => {
    const updated = slots.map((s, idx) => ({ ...s, order: idx + 1 }));
    set({ mealSlots: updated });
    await nutritionRepository.saveMealSlots(updated);
  },

  addCustomFood: async (foodData) => {
    const newFood: FoodItem = {
      ...foodData,
      id: `food_custom_${Date.now()}`,
      isCustom: true,
    };
    const { foodLibrary } = get();
    set({ foodLibrary: [newFood, ...foodLibrary] });
    await nutritionRepository.addCustomFood(newFood);
    return newFood;
  },

  updateGoals: async (goals) => {
    set({ goals });
    await nutritionRepository.saveGoals(goals);
  },

  logWater: async (date, deltaMl) => {
    const { habits } = get();
    const existing = habits[date] || {
      date,
      waterIntakeMl: 0,
      stuckToDiet: false,
      noJunkFood: false,
      supplementsTaken: false,
    };

    const newAmount = Math.max(0, (existing.waterIntakeMl || 0) + deltaMl);
    const updatedHabit: DailyHabitLog = {
      ...existing,
      waterIntakeMl: newAmount,
    };

    const updatedHabits = { ...habits, [date]: updatedHabit };
    set({ habits: updatedHabits });
    await nutritionRepository.saveHabit(date, updatedHabit);
  },

  toggleHabit: async (date, key) => {
    const { habits } = get();
    const existing = habits[date] || {
      date,
      waterIntakeMl: 0,
      stuckToDiet: false,
      noJunkFood: false,
      supplementsTaken: false,
    };

    const updatedHabit: DailyHabitLog = {
      ...existing,
      [key]: !existing[key],
    };

    const updatedHabits = { ...habits, [date]: updatedHabit };
    set({ habits: updatedHabits });
    await nutritionRepository.saveHabit(date, updatedHabit);
  },

  updateHabitNotes: async (date, notes) => {
    const { habits } = get();
    const existing = habits[date] || {
      date,
      waterIntakeMl: 0,
      stuckToDiet: false,
      noJunkFood: false,
      supplementsTaken: false,
    };

    const updatedHabit: DailyHabitLog = {
      ...existing,
      notes,
    };

    const updatedHabits = { ...habits, [date]: updatedHabit };
    set({ habits: updatedHabits });
    await nutritionRepository.saveHabit(date, updatedHabit);
  },

  getDayTotals: (date: string) => {
    const { loggedEntries, goals, habits } = get();
    const dayEntries = loggedEntries.filter((e) => e.date === date);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const e of dayEntries) {
      totalCalories += e.calories || 0;
      totalProtein += e.protein || 0;
      totalCarbs += e.carbs || 0;
      totalFat += e.fat || 0;
      totalFiber += e.fiber || 0;
    }

    // Round values cleanly
    totalCalories = Math.round(totalCalories);
    totalProtein = Math.round(totalProtein * 10) / 10;
    totalCarbs = Math.round(totalCarbs * 10) / 10;
    totalFat = Math.round(totalFat * 10) / 10;
    totalFiber = Math.round(totalFiber * 10) / 10;

    const habit = habits[date];
    const waterIntakeMl = habit?.waterIntakeMl || 0;

    const remainingCalories = goals.calorieTarget - totalCalories;
    const deficitVsMaintenance = goals.maintenanceCalories - totalCalories;
    const deficitVsTarget = goals.calorieTarget - totalCalories;

    // Macro percentages based on calorie contributions
    // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
    const proteinKcal = totalProtein * 4;
    const carbsKcal = totalCarbs * 4;
    const fatKcal = totalFat * 9;
    const macroTotalKcal = proteinKcal + carbsKcal + fatKcal || 1;

    const macroPercentages = {
      proteinPct: Math.round((proteinKcal / macroTotalKcal) * 100),
      carbsPct: Math.round((carbsKcal / macroTotalKcal) * 100),
      fatPct: Math.round((fatKcal / macroTotalKcal) * 100),
    };

    // Deficiencies & Smart Analysis
    const deficiencies: NutritionDeficiencyAlert[] = [];

    // Protein Analysis
    const proteinDiff = goals.proteinTarget - totalProtein;
    if (proteinDiff > 10) {
      deficiencies.push({
        type: 'protein',
        severity: proteinDiff > 35 ? 'warning' : 'info',
        title: `Protein Deficiency: ${Math.round(proteinDiff)}g Remaining`,
        message: `You need ${Math.round(proteinDiff * 4)} more kcal of protein to protect lean muscle mass and meet your ${goals.proteinTarget}g target.`,
        shortfallGrams: Math.round(proteinDiff),
      });
    } else {
      deficiencies.push({
        type: 'protein',
        severity: 'success',
        title: 'Protein Target Achieved! 💪',
        message: `Great job! You logged ${totalProtein}g of protein (target: ${goals.proteinTarget}g).`,
      });
    }

    // Calorie Deficit / Surplus Analysis
    if (goals.goalType === 'cut') {
      if (deficitVsMaintenance >= goals.targetDeficit - 100 && deficitVsMaintenance <= goals.targetDeficit + 250) {
        deficiencies.push({
          type: 'calories',
          severity: 'success',
          title: `Optimal Calorie Deficit (-${deficitVsMaintenance} kcal)`,
          message: `On track for steady fat loss! Consumed ${totalCalories} kcal against ${goals.maintenanceCalories} kcal maintenance.`,
        });
      } else if (deficitVsMaintenance < 0) {
        deficiencies.push({
          type: 'calories',
          severity: 'warning',
          title: `Calorie Surplus (+${Math.abs(deficitVsMaintenance)} kcal)`,
          message: `Exceeded maintenance calories. Consider a lighter next meal or extra movement to stay in deficit.`,
        });
      } else if (deficitVsMaintenance > goals.targetDeficit + 350) {
        deficiencies.push({
          type: 'calories',
          severity: 'info',
          title: `Large Calorie Deficit (-${deficitVsMaintenance} kcal)`,
          message: `You are in a steep deficit (${remainingCalories} kcal left). Ensure you get enough nutrients to prevent fatigue.`,
        });
      }
    } else if (goals.goalType === 'bulk') {
      const surplus = totalCalories - goals.maintenanceCalories;
      if (surplus >= 150) {
        deficiencies.push({
          type: 'calories',
          severity: 'success',
          title: `Anabolic Surplus (+${surplus} kcal)`,
          message: `Well-fueled for muscle growth without excess fat gain.`,
        });
      } else {
        deficiencies.push({
          type: 'calories',
          severity: 'info',
          title: `Under Surplus Target (${remainingCalories} kcal to target)`,
          message: `Add healthy calorie-dense foods like peanut butter, oats, or nuts to hit your growth surplus.`,
        });
      }
    }

    // Hydration Analysis
    const waterShortfall = goals.waterTargetMl - waterIntakeMl;
    if (waterShortfall > 500) {
      deficiencies.push({
        type: 'hydration',
        severity: waterShortfall > 1500 ? 'warning' : 'info',
        title: `Hydration Shortfall: ${waterShortfall}ml to go`,
        message: `Current intake: ${waterIntakeMl}ml / ${goals.waterTargetMl}ml. Drink a glass of water to maintain metabolic rate.`,
      });
    } else {
      deficiencies.push({
        type: 'hydration',
        severity: 'success',
        title: 'Hydration Target Met! 💧',
        message: `You reached ${waterIntakeMl}ml of water today. Excellent hydration habits!`,
      });
    }

    return {
      date,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      waterIntakeMl,
      calorieTarget: goals.calorieTarget,
      remainingCalories,
      deficitVsMaintenance,
      deficitVsTarget,
      proteinTarget: goals.proteinTarget,
      carbsTarget: goals.carbsTarget,
      fatTarget: goals.fatTarget,
      macroPercentages,
      deficiencies,
    };
  },

  getPeriodAnalytics: (startDate: string, endDate: string) => {
    const { loggedEntries, goals, habits } = get();

    // Collect all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysList: string[] = [];

    const cur = new Date(start);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      daysList.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }

    let sumCalories = 0;
    let sumProtein = 0;
    let sumCarbs = 0;
    let sumFat = 0;
    let sumWater = 0;
    let sumDeficit = 0;
    let adherentDays = 0;

    let highest: { date: string; calories: number } | null = null;
    let lowest: { date: string; calories: number } | null = null;

    const days = daysList.map((d) => {
      const entries = loggedEntries.filter((e) => e.date === d);
      const cals = entries.reduce((acc, e) => acc + (e.calories || 0), 0);
      const prot = entries.reduce((acc, e) => acc + (e.protein || 0), 0);
      const carb = entries.reduce((acc, e) => acc + (e.carbs || 0), 0);
      const fat = entries.reduce((acc, e) => acc + (e.fat || 0), 0);
      const water = habits[d]?.waterIntakeMl || 0;
      const deficit = goals.maintenanceCalories - cals;

      sumCalories += cals;
      sumProtein += prot;
      sumCarbs += carb;
      sumFat += fat;
      sumWater += water;
      sumDeficit += deficit;

      if (cals > 0) {
        // Within ±15% of target
        const diffRatio = Math.abs(cals - goals.calorieTarget) / goals.calorieTarget;
        if (diffRatio <= 0.15) {
          adherentDays += 1;
        }

        if (!highest || cals > highest.calories) highest = { date: d, calories: cals };
        if (!lowest || cals < lowest.calories) lowest = { date: d, calories: cals };
      }

      return {
        date: d,
        calories: Math.round(cals),
        protein: Math.round(prot),
        carbs: Math.round(carb),
        fat: Math.round(fat),
        water,
        calorieTarget: goals.calorieTarget,
        deficit,
      };
    });

    const totalDaysCount = daysList.length || 1;
    const activeDaysCount = days.filter((d) => d.calories > 0).length || 1;

    const avgCalories = Math.round(sumCalories / activeDaysCount);
    const avgProtein = Math.round((sumProtein / activeDaysCount) * 10) / 10;
    const avgCarbs = Math.round((sumCarbs / activeDaysCount) * 10) / 10;
    const avgFat = Math.round((sumFat / activeDaysCount) * 10) / 10;
    const avgWater = Math.round(sumWater / totalDaysCount);
    const adherenceRatePct = Math.round((adherentDays / activeDaysCount) * 100);

    // 7,700 kcal deficit ≈ 1 kg of fat loss
    const estimatedKgFatLoss = Math.round((sumDeficit / 7700) * 100) / 100;

    return {
      days,
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      avgWater,
      totalDeficit: sumDeficit,
      estimatedKgFatLoss,
      adherenceRatePct,
      highestCalorieDay: highest,
      lowestCalorieDay: lowest,
    };
  },
}));
