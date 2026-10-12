import { create } from 'zustand';
import { RoutineItem, RoutineCompletion } from '../types';
import { routineRepository } from '../services/repositories/routineRepository';
import { isRoutineScheduledForDate } from '../utils/date';

interface RoutineState {
  routines: RoutineItem[];
  completions: RoutineCompletion[];
  isLoading: boolean;
  loadRoutines: () => Promise<void>;
  toggleCompletion: (date: string, routineId: string) => Promise<void>;
  createRoutine: (routine: RoutineItem) => Promise<void>;
  updateRoutine: (routine: RoutineItem) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  reorderRoutines: (routines: RoutineItem[]) => Promise<void>;
  getRoutineProgress: (date: string) => { total: number; completed: number; percentage: number };
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  completions: [],
  isLoading: false,

  loadRoutines: async () => {
    set({ isLoading: true });
    try {
      const [routines, completions] = await Promise.all([
        routineRepository.getAllRoutines(),
        routineRepository.getAllCompletions(),
      ]);
      set({
        routines: routines.sort((a, b) => a.order - b.order),
        completions,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to load routines:', e);
      set({ isLoading: false });
    }
  },

  toggleCompletion: async (date: string, routineId: string) => {
    const { completions } = get();
    const existing = completions.find((c) => c.date === date && c.routineId === routineId);
    const newStatus = existing ? !existing.completed : true;

    // Optimistic update
    const updatedCompletions = existing
      ? completions.map((c) =>
          c.date === date && c.routineId === routineId
            ? { ...c, completed: newStatus, completedAt: newStatus ? new Date().toISOString() : undefined }
            : c
        )
      : [
          ...completions,
          {
            id: `rc_${date}_${routineId}`,
            date,
            routineId,
            completed: newStatus,
            completedAt: newStatus ? new Date().toISOString() : undefined,
          },
        ];

    set({ completions: updatedCompletions });

    try {
      await routineRepository.setCompletion(date, routineId, newStatus);
    } catch (e) {
      console.error('Failed to save routine completion:', e);
      // Revert optimistic update
      set({ completions });
    }
  },

  createRoutine: async (routine: RoutineItem) => {
    const { routines } = get();
    const updated = [...routines, routine].sort((a, b) => a.order - b.order);
    set({ routines: updated });
    await routineRepository.createRoutine(routine);
  },

  updateRoutine: async (routine: RoutineItem) => {
    const { routines } = get();
    const updated = routines.map((r) => (r.id === routine.id ? routine : r));
    set({ routines: updated });
    await routineRepository.updateRoutine(routine);
  },

  deleteRoutine: async (id: string) => {
    const { routines } = get();
    const updated = routines.filter((r) => r.id !== id);
    set({ routines: updated });
    await routineRepository.deleteRoutine(id);
  },

  reorderRoutines: async (newOrderList: RoutineItem[]) => {
    const updated = newOrderList.map((r, idx) => ({ ...r, order: idx + 1 }));
    set({ routines: updated });
    await routineRepository.saveRoutines(updated);
  },

  getRoutineProgress: (date: string) => {
    const { routines, completions } = get();
    const scheduled = routines.filter((r) => r.enabled && isRoutineScheduledForDate(r.repeatDays, date));
    const total = scheduled.length;
    if (total === 0) return { total: 0, completed: 0, percentage: 0 };

    const completedCount = scheduled.filter((r) => {
      const comp = completions.find((c) => c.date === date && c.routineId === r.id);
      return comp && comp.completed;
    }).length;

    const percentage = Math.round((completedCount / total) * 100);
    return { total, completed: completedCount, percentage };
  },
}));
