import { create } from 'zustand';
import { Expense } from '../types';
import { expenseRepository } from '../services/repositories/expenseRepository';

interface ExpenseSummary {
  total: number;
  count: number;
  needTotal: number;
  wantTotal: number;
  byCategory: Record<string, number>;
  byPayment: Record<string, number>;
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  searchQuery: string;
  filterCategory: string;
  filterType: 'ALL' | 'Need' | 'Want';
  filterPayment: string;

  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string) => void;
  setFilterType: (type: 'ALL' | 'Need' | 'Want') => void;
  setFilterPayment: (payment: string) => void;

  loadExpenses: () => Promise<void>;
  createExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  getFilteredExpenses: (date: string) => Expense[];
  getDailySummary: (date: string) => ExpenseSummary;
  reorderExpenses: (reorderedSubset: Expense[]) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  searchQuery: '',
  filterCategory: 'ALL',
  filterType: 'ALL',
  filterPayment: 'ALL',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilterCategory: (category: string) => set({ filterCategory: category }),
  setFilterType: (type: 'ALL' | 'Need' | 'Want') => set({ filterType: type }),
  setFilterPayment: (payment: string) => set({ filterPayment: payment }),

  loadExpenses: async () => {
    set({ isLoading: true });
    try {
      const expenses = await expenseRepository.getAllExpenses();
      set({ expenses, isLoading: false });
    } catch (e) {
      console.error('Failed to load expenses:', e);
      set({ isLoading: false });
    }
  },

  createExpense: async (expense: Expense) => {
    const { expenses } = get();
    set({ expenses: [...expenses, expense] });
    await expenseRepository.createExpense(expense);
  },

  updateExpense: async (expense: Expense) => {
    const { expenses } = get();
    const updated = expenses.map((e) => (e.id === expense.id ? expense : e));
    set({ expenses: updated });
    await expenseRepository.updateExpense(expense);
  },

  deleteExpense: async (id: string) => {
    const { expenses } = get();
    const filtered = expenses.filter((e) => e.id !== id);
    set({ expenses: filtered });
    await expenseRepository.deleteExpense(id);
  },

  getFilteredExpenses: (date: string) => {
    const { expenses, searchQuery, filterCategory, filterType, filterPayment } = get();
    return expenses
      .filter((e) => {
        if (e.date !== date) return false;
        if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
        if (filterType !== 'ALL' && e.type !== filterType) return false;
        if (filterPayment !== 'ALL' && e.paymentMethod !== filterPayment) return false;
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = e.title.toLowerCase().includes(q);
          const matchesDesc = e.description?.toLowerCase().includes(q);
          const matchesCategory = e.category.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
        }
        return true;
      })
      .sort((a, b) => a.itemNumber - b.itemNumber);
  },

  getDailySummary: (date: string): ExpenseSummary => {
    const { expenses } = get();
    const dayExpenses = expenses.filter((e) => e.date === date);

    let total = 0;
    let needTotal = 0;
    let wantTotal = 0;
    const byCategory: Record<string, number> = {};
    const byPayment: Record<string, number> = {};

    dayExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      total += amt;
      if (e.type === 'Need') {
        needTotal += amt;
      } else {
        wantTotal += amt;
      }

      byCategory[e.category] = (byCategory[e.category] || 0) + amt;
      byPayment[e.paymentMethod] = (byPayment[e.paymentMethod] || 0) + amt;
    });

    return {
      total: Math.round(total * 100) / 100,
      count: dayExpenses.length,
      needTotal: Math.round(needTotal * 100) / 100,
      wantTotal: Math.round(wantTotal * 100) / 100,
      byCategory,
      byPayment,
    };
  },

  reorderExpenses: async (reorderedSubset: Expense[]) => {
    const { expenses } = get();
    if (reorderedSubset.length === 0) return;
    const reorderedIds = new Set(reorderedSubset.map((e) => e.id));
    const firstIdx = expenses.findIndex((e) => reorderedIds.has(e.id));
    const remaining = expenses.filter((e) => !reorderedIds.has(e.id));
    const insertAt = firstIdx >= 0 ? firstIdx : 0;
    const updatedSubset = reorderedSubset.map((e, idx) => ({ ...e, itemNumber: idx + 1 }));
    const newExpenses = [...remaining];
    newExpenses.splice(insertAt, 0, ...updatedSubset);
    set({ expenses: newExpenses });
    await expenseRepository.saveAllExpenses(newExpenses);
  },
}));
