import { RoutineItem, RoutineCompletion } from '../../types';
import { appStorage } from '../storage/storageAdapter';
import { SEED_ROUTINES, SEED_ROUTINE_COMPLETIONS } from '../../data/seed/initialData';

const ROUTINES_KEY = 'daily_view_routines_v1';
const COMPLETIONS_KEY = 'daily_view_routine_completions_v1';
const INITIALIZED_KEY = 'daily_view_initialized_v1';

export class RoutineRepository {
  async ensureInitialized(): Promise<void> {
    const initialized = await appStorage.getItem<boolean>(INITIALIZED_KEY);
    if (!initialized) {
      await appStorage.setItem(ROUTINES_KEY, SEED_ROUTINES);
      await appStorage.setItem(COMPLETIONS_KEY, SEED_ROUTINE_COMPLETIONS);
      await appStorage.setItem(INITIALIZED_KEY, true);
    }
  }

  async getAllRoutines(): Promise<RoutineItem[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<RoutineItem[]>(ROUTINES_KEY);
    return data || SEED_ROUTINES;
  }

  async saveRoutines(routines: RoutineItem[]): Promise<void> {
    await appStorage.setItem(ROUTINES_KEY, routines);
  }

  async createRoutine(routine: RoutineItem): Promise<void> {
    const current = await this.getAllRoutines();
    const updated = [...current, routine];
    await this.saveRoutines(updated);
  }

  async updateRoutine(routine: RoutineItem): Promise<void> {
    const current = await this.getAllRoutines();
    const index = current.findIndex((r) => r.id === routine.id);
    if (index !== -1) {
      current[index] = routine;
      await this.saveRoutines([...current]);
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    const current = await this.getAllRoutines();
    const updated = current.filter((r) => r.id !== id);
    await this.saveRoutines(updated);
  }

  async getAllCompletions(): Promise<RoutineCompletion[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<RoutineCompletion[]>(COMPLETIONS_KEY);
    return data || SEED_ROUTINE_COMPLETIONS;
  }

  async getCompletionsByDate(date: string): Promise<RoutineCompletion[]> {
    const all = await this.getAllCompletions();
    return all.filter((c) => c.date === date);
  }

  async setCompletion(date: string, routineId: string, completed: boolean): Promise<RoutineCompletion> {
    const all = await this.getAllCompletions();
    const existingIndex = all.findIndex((c) => c.date === date && c.routineId === routineId);
    let record: RoutineCompletion;

    if (existingIndex !== -1) {
      record = {
        ...all[existingIndex],
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      all[existingIndex] = record;
    } else {
      record = {
        id: `rc_${date}_${routineId}`,
        date,
        routineId,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      all.push(record);
    }

    await appStorage.setItem(COMPLETIONS_KEY, all);
    return record;
  }

  async saveAllCompletions(completions: RoutineCompletion[]): Promise<void> {
    await appStorage.setItem(COMPLETIONS_KEY, completions);
  }
}

export const routineRepository = new RoutineRepository();
