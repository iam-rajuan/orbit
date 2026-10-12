import { UserSettings, RoutineItem } from '../types';

export const DEFAULT_TASK_CATEGORIES: string[] = [
  'Office',
  'Study',
  'Personal',
  'Finance',
  'Health',
];

export const DEFAULT_TASK_TYPES: string[] = [
  'Project',
  'Micro',
  'Learning',
  'General',
  'Habit',
  'Meeting',
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Groceries',
  'Snacks & Tea',
  'Commute',
  'Food & Dining',
  'Personal',
  'Utilities',
];

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Card',
  'Other',
];

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  currency: '৳',
  currencyCode: 'BDT',
  dateFormat: 'EEEE, dd MMMM yyyy',
  timeFormat: '12h',
  taskCategories: DEFAULT_TASK_CATEGORIES,
  taskTypes: DEFAULT_TASK_TYPES,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
};

export const DEFAULT_ROUTINES: Omit<RoutineItem, 'id'>[] = [
  { time: '3:30 AM', title: 'Wake Up', description: 'Early morning start', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 1 },
  { time: '5:00 AM', title: 'Chickpeas', description: 'Morning protein diet', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 2 },
  { time: '6:00 AM', title: 'Peanuts', description: 'Healthy fat intake', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 3 },
  { time: '8:00 AM', title: 'Office', description: 'Start workday', repeatDays: [1, 2, 3, 4, 5], enabled: true, order: 4 },
  { time: '10:00 AM', title: 'Lunch + Salt Water', description: 'Hydration and recovery', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 5 },
  { time: '3:50 PM', title: 'Pre-Workout Meal', description: 'Energy before gym', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 6 },
  { time: '5:00 PM', title: 'Leave Office', description: 'Wrap up work', repeatDays: [1, 2, 3, 4, 5], enabled: true, order: 7 },
  { time: '5:30 PM', title: 'Gym', description: 'Strength and conditioning', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 8 },
  { time: '7:00 PM', title: 'Leave Gym', description: 'Post-workout stretch & transit', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 9 },
  { time: '7:30 PM', title: 'Arrive Home', description: 'Freshen up and unpack', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 10 },
  { time: '7:30 PM', title: 'Dinner', description: 'Nutritious evening meal', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 11 },
  { time: '9:00 PM', title: 'Sleep', description: 'Adequate sleep for recovery', repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, order: 12 },
];
