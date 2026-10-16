export type TaskPriority = 'High' | 'Medium' | 'Low';

export type TaskCategory =
  | 'Office'
  | 'Study'
  | 'Personal'
  | 'Finance'
  | 'Health'
  | string;

export type TaskType =
  | 'Project'
  | 'Micro'
  | 'Learning'
  | 'General'
  | 'Habit'
  | 'Meeting'
  | string;

export type TaskHorizon = 'next_7_days' | 'this_month' | 'someday';

export interface Task {
  id: string;
  heading?: string; // e.g. "Architecture & Strategy", "Deep Learning", "Personal Life"
  title: string;
  description?: string;
  category: TaskCategory;
  type: TaskType;
  priority: TaskPriority;
  projectId?: string;
  projectName?: string;
  notes?: string;
  date: string; // YYYY-MM-DD or 'someday'
  dueDate?: string; // YYYY-MM-DD
  horizon?: TaskHorizon; // 'next_7_days' | 'this_month' | 'someday'
  estimatedTime?: string; // e.g. "15m", "30m", "1h", "2h+"
  isUpcoming?: boolean; // marks task as part of future/upcoming backlog
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineItem {
  id: string;
  time: string; // e.g. "3:30 AM" or "03:30"
  title: string;
  description?: string;
  repeatDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  enabled: boolean;
  order: number;
}

export interface RoutineCompletion {
  id: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export type ExpenseType = 'Need' | 'Want';

export type PaymentMethod =
  | 'Cash'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Bank Transfer'
  | 'Card'
  | 'Other'
  | string;

export type ExpenseCategory =
  | 'Groceries'
  | 'Snacks & Tea'
  | 'Commute'
  | 'Food & Dining'
  | 'Personal'
  | 'Utilities'
  | string;

export interface Expense {
  id: string;
  itemNumber: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  type: ExpenseType;
  title: string; // Expense Item
  description?: string; // Notes / Description
  amount: number; // In minor unit or float with fixed 2 decimals
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string; // Default: '৳'
  currencyCode: string; // Default: 'BDT'
  dateFormat: string; // Default: 'EEEE, dd MMMM yyyy'
  timeFormat: '12h' | '24h';
  taskCategories: string[];
  taskTypes: string[];
  expenseCategories: string[];
  paymentMethods: string[];
}

export interface DailySummaryStats {
  routineCompleted: number;
  routineTotal: number;
  routinePercentage: number;
  tasksCompleted: number;
  tasksTotal: number;
  tasksPending: number;
  tasksPercentage: number;
  expensesTotal: number;
  expensesCount: number;
  needExpensesTotal: number;
  wantExpensesTotal: number;
}

export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  settings: UserSettings;
  routines: RoutineItem[];
  routineCompletions: RoutineCompletion[];
  tasks: Task[];
  expenses: Expense[];
}

export type WishlistPriority = 'High' | 'Medium' | 'Low';
export type WishlistStatus = 'saved' | 'ready' | 'purchased' | 'dropped';

export interface WishlistItem {
  id: string;
  title: string;
  estimatedPrice: number;
  category: string;
  priority: WishlistPriority;
  targetDate?: string; // YYYY-MM-DD
  url?: string;
  notes?: string;
  status: WishlistStatus;
  createdAt: string;
  purchasedAt?: string;
  convertedExpenseId?: string;
}

export * from './nutrition';

