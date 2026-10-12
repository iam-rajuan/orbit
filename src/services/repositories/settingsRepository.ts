import { UserSettings, ExportDataPayload } from '../../types';
import { appStorage } from '../storage/storageAdapter';
import { DEFAULT_SETTINGS } from '../../constants/defaults';
import { taskRepository } from './taskRepository';
import { routineRepository } from './routineRepository';
import { expenseRepository } from './expenseRepository';
import { SEED_ROUTINES, SEED_ROUTINE_COMPLETIONS, SEED_TASKS, SEED_EXPENSES } from '../../data/seed/initialData';

const SETTINGS_KEY = 'daily_view_settings_v1';

export class SettingsRepository {
  async getSettings(): Promise<UserSettings> {
    const data = await appStorage.getItem<UserSettings>(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await appStorage.setItem(SETTINGS_KEY, settings);
  }

  async exportAllData(): Promise<ExportDataPayload> {
    const settings = await this.getSettings();
    const routines = await routineRepository.getAllRoutines();
    const routineCompletions = await routineRepository.getAllCompletions();
    const tasks = await taskRepository.getAllTasks();
    const expenses = await expenseRepository.getAllExpenses();

    return {
      version: 4,
      exportedAt: new Date().toISOString(),
      settings,
      routines,
      routineCompletions,
      tasks,
      expenses,
    };
  }

  async importData(payload: ExportDataPayload): Promise<void> {
    if (!payload || !payload.version) {
      throw new Error('Invalid backup file format');
    }
    if (payload.settings) {
      await this.saveSettings(payload.settings);
    }
    if (Array.isArray(payload.routines)) {
      await routineRepository.saveRoutines(payload.routines);
    }
    if (Array.isArray(payload.routineCompletions)) {
      await routineRepository.saveAllCompletions(payload.routineCompletions);
    }
    if (Array.isArray(payload.tasks)) {
      await taskRepository.saveAllTasks(payload.tasks);
    }
    if (Array.isArray(payload.expenses)) {
      await expenseRepository.saveAllExpenses(payload.expenses);
    }
  }

  async resetToSampleData(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
    await routineRepository.saveRoutines(SEED_ROUTINES);
    await routineRepository.saveAllCompletions(SEED_ROUTINE_COMPLETIONS);
    await taskRepository.saveAllTasks(SEED_TASKS);
    await expenseRepository.saveAllExpenses(SEED_EXPENSES);
  }

  async clearAllData(): Promise<void> {
    await appStorage.clear();
  }
}

export const settingsRepository = new SettingsRepository();
