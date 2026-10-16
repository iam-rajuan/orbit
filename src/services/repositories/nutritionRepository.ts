import {
  MealSlot,
  FoodItem,
  LoggedMealEntry,
  NutritionGoals,
  DailyHabitLog,
} from '../../types/nutrition';
import { appStorage } from '../storage/storageAdapter';
import {
  DEFAULT_MEAL_SLOTS,
  DEFAULT_FOOD_LIBRARY,
  DEFAULT_NUTRITION_GOALS,
  SEED_LOGGED_MEALS,
  SEED_HABIT_LOGS,
} from '../../data/seed/nutritionSeed';

const MEALS_STORAGE_KEY = 'daily_view_nutrition_meals_v1';
const SLOTS_STORAGE_KEY = 'daily_view_nutrition_slots_v1';
const FOODS_STORAGE_KEY = 'daily_view_nutrition_foods_v1';
const GOALS_STORAGE_KEY = 'daily_view_nutrition_goals_v1';
const HABITS_STORAGE_KEY = 'daily_view_nutrition_habits_v1';
const INITIALIZED_KEY = 'daily_view_nutrition_init_v1';

export class NutritionRepository {
  async ensureInitialized(): Promise<void> {
    const initialized = await appStorage.getItem<boolean>(INITIALIZED_KEY);
    if (!initialized) {
      await Promise.all([
        appStorage.setItem(MEALS_STORAGE_KEY, SEED_LOGGED_MEALS),
        appStorage.setItem(SLOTS_STORAGE_KEY, DEFAULT_MEAL_SLOTS),
        appStorage.setItem(FOODS_STORAGE_KEY, DEFAULT_FOOD_LIBRARY),
        appStorage.setItem(GOALS_STORAGE_KEY, DEFAULT_NUTRITION_GOALS),
        appStorage.setItem(HABITS_STORAGE_KEY, SEED_HABIT_LOGS),
        appStorage.setItem(INITIALIZED_KEY, true),
      ]);
    }
  }

  // --- Logged Meal Entries ---
  async getAllEntries(): Promise<LoggedMealEntry[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<LoggedMealEntry[]>(MEALS_STORAGE_KEY);
    return data || SEED_LOGGED_MEALS;
  }

  async getEntriesByDate(date: string): Promise<LoggedMealEntry[]> {
    const all = await this.getAllEntries();
    return all.filter((entry) => entry.date === date);
  }

  async saveAllEntries(entries: LoggedMealEntry[]): Promise<void> {
    await appStorage.setItem(MEALS_STORAGE_KEY, entries);
  }

  async addEntry(entry: LoggedMealEntry): Promise<void> {
    const all = await this.getAllEntries();
    all.push(entry);
    await this.saveAllEntries(all);
  }

  async updateEntry(entry: LoggedMealEntry): Promise<void> {
    const all = await this.getAllEntries();
    const idx = all.findIndex((e) => e.id === entry.id);
    if (idx !== -1) {
      all[idx] = entry;
      await this.saveAllEntries([...all]);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    const all = await this.getAllEntries();
    const filtered = all.filter((e) => e.id !== id);
    await this.saveAllEntries(filtered);
  }

  // --- Meal Slots (Routine) ---
  async getMealSlots(): Promise<MealSlot[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<MealSlot[]>(SLOTS_STORAGE_KEY);
    return data || DEFAULT_MEAL_SLOTS;
  }

  async saveMealSlots(slots: MealSlot[]): Promise<void> {
    await appStorage.setItem(SLOTS_STORAGE_KEY, slots);
  }

  // --- Food Library ---
  async getFoodLibrary(): Promise<FoodItem[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<FoodItem[]>(FOODS_STORAGE_KEY);
    return data || DEFAULT_FOOD_LIBRARY;
  }

  async saveFoodLibrary(foods: FoodItem[]): Promise<void> {
    await appStorage.setItem(FOODS_STORAGE_KEY, foods);
  }

  async addCustomFood(food: FoodItem): Promise<void> {
    const all = await this.getFoodLibrary();
    all.unshift(food);
    await this.saveFoodLibrary(all);
  }

  // --- Goals ---
  async getGoals(): Promise<NutritionGoals> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<NutritionGoals>(GOALS_STORAGE_KEY);
    return data || DEFAULT_NUTRITION_GOALS;
  }

  async saveGoals(goals: NutritionGoals): Promise<void> {
    await appStorage.setItem(GOALS_STORAGE_KEY, goals);
  }

  // --- Habits & Water ---
  async getAllHabits(): Promise<Record<string, DailyHabitLog>> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<Record<string, DailyHabitLog>>(HABITS_STORAGE_KEY);
    return data || SEED_HABIT_LOGS;
  }

  async saveHabit(date: string, habit: DailyHabitLog): Promise<void> {
    const all = await this.getAllHabits();
    all[date] = habit;
    await appStorage.setItem(HABITS_STORAGE_KEY, { ...all });
  }
}

export const nutritionRepository = new NutritionRepository();
