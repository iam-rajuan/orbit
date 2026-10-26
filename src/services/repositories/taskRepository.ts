import { Task } from '../../types';
import { appStorage } from '../storage/storageAdapter';
import { SEED_TASKS } from '../../data/seed/initialData';
import { SEED_FUTURE_TASKS } from '../../data/seed/futureTasksData';
import { offsetDateKey } from '../../utils/date';

const TASKS_KEY = 'daily_view_tasks_v1';
const INITIALIZED_KEY = 'daily_view_initialized_v1';

export class TaskRepository {
  async ensureInitialized(): Promise<void> {
    const initialized = await appStorage.getItem<boolean>(INITIALIZED_KEY);
    if (!initialized) {
      await appStorage.setItem(TASKS_KEY, [...SEED_FUTURE_TASKS, ...SEED_TASKS]);
      await appStorage.setItem(INITIALIZED_KEY, true);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<Task[]>(TASKS_KEY);
    const existing = data || [...SEED_FUTURE_TASKS, ...SEED_TASKS];
    const hasUpcoming = existing.some((t) => t.isUpcoming || t.horizon);
    if (!hasUpcoming) {
      const merged = [...SEED_FUTURE_TASKS, ...existing];
      await this.saveAllTasks(merged);
      return merged;
    }
    return existing;
  }

  async getTasksByDate(date: string): Promise<Task[]> {
    const all = await this.getAllTasks();
    return all.filter((t) => t.date === date);
  }

  async saveAllTasks(tasks: Task[]): Promise<void> {
    await appStorage.setItem(TASKS_KEY, tasks);
  }

  async createTask(task: Task): Promise<void> {
    const all = await this.getAllTasks();
    all.push(task);
    await this.saveAllTasks(all);
  }

  async updateTask(task: Task): Promise<void> {
    const all = await this.getAllTasks();
    const index = all.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      all[index] = task;
      await this.saveAllTasks([...all]);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const all = await this.getAllTasks();
    const filtered = all.filter((t) => t.id !== id);
    await this.saveAllTasks(filtered);
  }

  async toggleTaskComplete(id: string): Promise<Task | null> {
    const all = await this.getAllTasks();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const task = all[index];
    const newCompleted = !task.completed;
    const updated: Task = {
      ...task,
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    await this.saveAllTasks([...all]);
    return updated;
  }

  async bulkComplete(ids: string[], completed: boolean): Promise<void> {
    const all = await this.getAllTasks();
    const now = new Date().toISOString();
    const updated = all.map((t) => {
      if (ids.includes(t.id)) {
        return {
          ...t,
          completed,
          completedAt: completed ? now : undefined,
          updatedAt: now,
        };
      }
      return t;
    });
    await this.saveAllTasks(updated);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const all = await this.getAllTasks();
    const filtered = all.filter((t) => !ids.includes(t.id));
    await this.saveAllTasks(filtered);
  }

  async forwardTaskToTomorrow(id: string): Promise<Task | null> {
    const all = await this.getAllTasks();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const task = all[index];
    const targetDate = task.date === 'someday' ? new Date().toISOString().slice(0, 10) : task.date;
    const nextDate = offsetDateKey(targetDate, 1);
    const forwardCount = (task.forwardCount || 0) + 1;
    const originalDate = task.originalDate || task.date;
    const now = new Date().toISOString();

    const updated: Task = {
      ...task,
      date: nextDate,
      forwardCount,
      originalDate,
      lastForwardedAt: now,
      updatedAt: now,
    };
    all[index] = updated;
    await this.saveAllTasks([...all]);
    return updated;
  }

  async bulkForwardToTomorrow(ids: string[]): Promise<void> {
    const all = await this.getAllTasks();
    const now = new Date().toISOString();
    const updated = all.map((t) => {
      if (ids.includes(t.id)) {
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
    await this.saveAllTasks(updated);
  }
}

export const taskRepository = new TaskRepository();
