import { Expense } from '../../types';
import { appStorage } from '../storage/storageAdapter';
import { SEED_EXPENSES } from '../../data/seed/initialData';

const EXPENSES_KEY = 'daily_view_expenses_v1';
const INITIALIZED_KEY = 'daily_view_initialized_v1';

export class ExpenseRepository {
  async ensureInitialized(): Promise<void> {
    const initialized = await appStorage.getItem<boolean>(INITIALIZED_KEY);
    if (!initialized) {
      await appStorage.setItem(EXPENSES_KEY, SEED_EXPENSES);
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    await this.ensureInitialized();
    const data = await appStorage.getItem<Expense[]>(EXPENSES_KEY);
    return data || SEED_EXPENSES;
  }

  async getExpensesByDate(date: string): Promise<Expense[]> {
    const all = await this.getAllExpenses();
    return all.filter((e) => e.date === date).sort((a, b) => a.itemNumber - b.itemNumber);
  }

  async saveAllExpenses(expenses: Expense[]): Promise<void> {
    await appStorage.setItem(EXPENSES_KEY, expenses);
  }

  async createExpense(expense: Expense): Promise<void> {
    const all = await this.getAllExpenses();
    // Calculate auto itemNumber for the day if not provided
    const dateExpenses = all.filter((e) => e.date === expense.date);
    const maxNum = dateExpenses.reduce((max, e) => Math.max(max, e.itemNumber || 0), 0);
    const newExpense: Expense = {
      ...expense,
      itemNumber: expense.itemNumber || maxNum + 1,
    };
    all.push(newExpense);
    await this.saveAllExpenses(all);
  }

  async updateExpense(expense: Expense): Promise<void> {
    const all = await this.getAllExpenses();
    const index = all.findIndex((e) => e.id === expense.id);
    if (index !== -1) {
      all[index] = expense;
      await this.saveAllExpenses([...all]);
    }
  }

  async deleteExpense(id: string): Promise<void> {
    const all = await this.getAllExpenses();
    const filtered = all.filter((e) => e.id !== id);
    await this.saveAllExpenses(filtered);
  }
}

export const expenseRepository = new ExpenseRepository();
