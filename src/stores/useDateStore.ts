import { create } from 'zustand';
import { getTodayKey, offsetDateKey } from '../utils/date';

interface DateState {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
}

// Default to 2026-10-06 so user lands right into their loaded sample spreadsheet data
export const useDateStore = create<DateState>((set, get) => ({
  selectedDate: '2026-10-06',
  setSelectedDate: (date: string) => set({ selectedDate: date }),
  goToPreviousDay: () => {
    const current = get().selectedDate;
    set({ selectedDate: offsetDateKey(current, -1) });
  },
  goToNextDay: () => {
    const current = get().selectedDate;
    set({ selectedDate: offsetDateKey(current, 1) });
  },
  goToToday: () => {
    set({ selectedDate: getTodayKey() });
  },
}));
