import { create } from 'zustand';
import { Task } from '../types';
import { taskRepository } from '../services/repositories/taskRepository';
import { offsetDateKey } from '../utils/date';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  searchQuery: string;
  filterCategory: string;
  filterPriority: string;
  filterStatus: 'ALL' | 'COMPLETED' | 'PENDING';
  selectedTaskIds: string[];

  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string) => void;
  setFilterPriority: (priority: string) => void;
  setFilterStatus: (status: 'ALL' | 'COMPLETED' | 'PENDING') => void;
  toggleSelectTask: (id: string) => void;
  selectAllTasks: (date: string) => void;
  clearSelection: () => void;

  loadTasks: () => Promise<void>;
  createTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  bulkComplete: (completed: boolean) => Promise<void>;
  bulkDelete: () => Promise<void>;

  getFilteredTasks: (date: string) => Task[];
  getTaskProgress: (date: string) => { total: number; completed: number; pending: number; percentage: number };
  moveToToday: (taskId: string, todayDate: string) => Promise<void>;
  forwardTaskToTomorrow: (id: string) => Promise<Task | null>;
  bulkForwardToTomorrow: (ids?: string[]) => Promise<number>;
  undoForwardTask: (id: string, previousDate: string, previousCount?: number, previousOriginalDate?: string) => Promise<void>;
  resetForwardCount: (id: string) => Promise<void>;
  togglePinTask: (id: string) => Promise<void>;
  updateTaskColor: (id: string, color: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  reorderTasks: (reorderedSubset: Task[]) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  searchQuery: '',
  filterCategory: 'ALL',
  filterPriority: 'ALL',
  filterStatus: 'ALL',
  selectedTaskIds: [],

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilterCategory: (category: string) => set({ filterCategory: category }),
  setFilterPriority: (priority: string) => set({ filterPriority: priority }),
  setFilterStatus: (status: 'ALL' | 'COMPLETED' | 'PENDING') => set({ filterStatus: status }),

  toggleSelectTask: (id: string) => {
    const { selectedTaskIds } = get();
    if (selectedTaskIds.includes(id)) {
      set({ selectedTaskIds: selectedTaskIds.filter((tId) => tId !== id) });
    } else {
      set({ selectedTaskIds: [...selectedTaskIds, id] });
    }
  },

  selectAllTasks: (date: string) => {
    const dayTasks = get().getFilteredTasks(date);
    const dayTaskIds = dayTasks.map((t) => t.id);
    const { selectedTaskIds } = get();
    const allSelected = dayTaskIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      set({ selectedTaskIds: selectedTaskIds.filter((id) => !dayTaskIds.includes(id)) });
    } else {
      const merged = Array.from(new Set([...selectedTaskIds, ...dayTaskIds]));
      set({ selectedTaskIds: merged });
    }
  },

  clearSelection: () => set({ selectedTaskIds: [] }),

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskRepository.getAllTasks();
      set({ tasks, isLoading: false });
    } catch (e) {
      console.error('Failed to load tasks:', e);
      set({ isLoading: false });
    }
  },

  createTask: async (task: Task) => {
    const { tasks } = get();
    set({ tasks: [task, ...tasks] });
    await taskRepository.createTask(task);
  },

  updateTask: async (task: Task) => {
    const { tasks } = get();
    const updated = tasks.map((t) => (t.id === task.id ? task : t));
    set({ tasks: updated });
    await taskRepository.updateTask(task);
  },

  deleteTask: async (id: string) => {
    const { tasks, selectedTaskIds } = get();
    set({
      tasks: tasks.filter((t) => t.id !== id),
      selectedTaskIds: selectedTaskIds.filter((tId) => tId !== id),
    });
    await taskRepository.deleteTask(id);
  },

  toggleTaskComplete: async (id: string) => {
    const { tasks } = get();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const newCompleted = !target.completed;
    const now = new Date().toISOString();
    // Optimistic update
    const updated = tasks.map((t) =>
      t.id === id
        ? { ...t, completed: newCompleted, completedAt: newCompleted ? now : undefined, updatedAt: now }
        : t
    );
    set({ tasks: updated });

    try {
      await taskRepository.toggleTaskComplete(id);
    } catch (e) {
      console.error('Failed to toggle task:', e);
      set({ tasks });
    }
  },

  bulkComplete: async (completed: boolean) => {
    const { tasks, selectedTaskIds } = get();
    if (selectedTaskIds.length === 0) return;

    const now = new Date().toISOString();
    const updated = tasks.map((t) =>
      selectedTaskIds.includes(t.id)
        ? { ...t, completed, completedAt: completed ? now : undefined, updatedAt: now }
        : t
    );
    set({ tasks: updated, selectedTaskIds: [] });
    await taskRepository.bulkComplete(selectedTaskIds, completed);
  },

  bulkDelete: async () => {
    const { tasks, selectedTaskIds } = get();
    if (selectedTaskIds.length === 0) return;

    const updated = tasks.filter((t) => !selectedTaskIds.includes(t.id));
    const idsToDelete = [...selectedTaskIds];
    set({ tasks: updated, selectedTaskIds: [] });
    await taskRepository.bulkDelete(idsToDelete);
  },

  getFilteredTasks: (date: string) => {
    const { tasks, searchQuery, filterCategory, filterPriority, filterStatus } = get();
    return tasks.filter((t) => {
      if (t.date !== date) return false;
      if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
      if (filterStatus === 'COMPLETED' && !t.completed) return false;
      if (filterStatus === 'PENDING' && t.completed) return false;
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesProject = t.projectName?.toLowerCase().includes(query);
        const matchesNotes = t.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProject && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  },

  getTaskProgress: (date: string) => {
    const { tasks } = get();
    const dayTasks = tasks.filter((t) => t.date === date);
    const total = dayTasks.length;
    if (total === 0) return { total: 0, completed: 0, pending: 0, percentage: 0 };

    const completed = dayTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, pending, percentage };
  },

  moveToToday: async (taskId: string, todayDate: string) => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updated: Task = {
      ...target,
      date: todayDate,
      isUpcoming: false,
      horizon: 'today' as any,
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
  },

  forwardTaskToTomorrow: async (id: string): Promise<Task | null> => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === id);
    if (!target) return null;

    const targetDate = target.date === 'someday' ? new Date().toISOString().slice(0, 10) : target.date;
    const nextDate = offsetDateKey(targetDate, 1);
    const forwardCount = (target.forwardCount || 0) + 1;
    const originalDate = target.originalDate || target.date;
    const now = new Date().toISOString();

    const updated: Task = {
      ...target,
      date: nextDate,
      forwardCount,
      originalDate,
      lastForwardedAt: now,
      updatedAt: now,
    };
    await updateTask(updated);
    return updated;
  },

  bulkForwardToTomorrow: async (ids?: string[]): Promise<number> => {
    const { tasks, selectedTaskIds } = get();
    const targetIds = ids && ids.length > 0 ? ids : selectedTaskIds;
    if (targetIds.length === 0) return 0;

    const now = new Date().toISOString();
    const updated = tasks.map((t) => {
      if (targetIds.includes(t.id)) {
        const targetDate = t.date === 'someday' ? new Date().toISOString().slice(0, 10) : t.date;
        return {
          ...t,
          date: offsetDateKey(targetDate, 1),
          forwardCount: (t.forwardCount || 0) + 1,
          originalDate: t.originalDate || t.date,
          lastForwardedAt: now,
          updatedAt: now,
        };
      }
      return t;
    });

    set({ tasks: updated, selectedTaskIds: [] });
    await taskRepository.bulkForwardToTomorrow(targetIds);
    return targetIds.length;
  },

  undoForwardTask: async (
    id: string,
    previousDate: string,
    previousCount?: number,
    previousOriginalDate?: string
  ) => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const updated: Task = {
      ...target,
      date: previousDate,
      forwardCount: previousCount,
      originalDate: previousOriginalDate,
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
  },

  resetForwardCount: async (id: string) => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const updated: Task = {
      ...target,
      forwardCount: 0,
      originalDate: undefined,
      lastForwardedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
  },

  togglePinTask: async (id: string) => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const updated: Task = {
      ...target,
      pinned: !target.pinned,
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
  },

  updateTaskColor: async (id: string, color: string) => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const updated: Task = {
      ...target,
      color,
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
  },

  toggleChecklistItem: async (taskId: string, itemId: string) => {
    const { tasks, updateTask } = get();
    const target = tasks.find((t) => t.id === taskId);
    if (!target || !target.checklist) return;
    const updatedChecklist = target.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const updated: Task = {
      ...target,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
  },

  reorderTasks: async (reorderedSubset: Task[]) => {
    const { tasks } = get();
    if (reorderedSubset.length === 0) return;
    const reorderedIds = new Set(reorderedSubset.map((t) => t.id));
    const firstIdx = tasks.findIndex((t) => reorderedIds.has(t.id));
    const remainingTasks = tasks.filter((t) => !reorderedIds.has(t.id));
    const insertAt = firstIdx >= 0 ? firstIdx : 0;
    const newTasks = [...remainingTasks];
    newTasks.splice(insertAt, 0, ...reorderedSubset);
    set({ tasks: newTasks });
    await taskRepository.saveAllTasks(newTasks);
  },
}));
