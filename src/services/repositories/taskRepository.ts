import { Task } from '../../types';
import { appStorage } from '../storage/storageAdapter';
import { SEED_TASKS } from '../../data/seed/initialData';

const TASKS_KEY = 'daily_view_tasks_v1';
const INITIALIZED_KEY = 'daily_view_initialized_v1';

export class TaskRepository {
  async ensureInitialized(): Promise<void> {
    const initialized = await appStorage.getItem<boolean>(INITIALIZED_KEY);
    if (!initialized) {
      await appStorage.setItem(TASKS_KEY, SEED_TASKS);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<Task[]>(TASKS_KEY);
    return data || SEED_TASKS;
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
}

export const taskRepository = new TaskRepository();
