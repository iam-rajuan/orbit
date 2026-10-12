import { create } from 'zustand';
import { UserSettings, ExportDataPayload } from '../types';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { settingsRepository } from '../services/repositories/settingsRepository';

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  resetSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportData: () => Promise<ExportDataPayload>;
  importData: (payload: ExportDataPayload) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await settingsRepository.getSettings();
      set({ settings, isLoading: false });
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial: Partial<UserSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
    await settingsRepository.saveSettings(updated);
  },

  resetSampleData: async () => {
    set({ isLoading: true });
    await settingsRepository.resetToSampleData();
    set({ settings: DEFAULT_SETTINGS, isLoading: false });
  },

  clearAllData: async () => {
    set({ isLoading: true });
    await settingsRepository.clearAllData();
    set({ settings: DEFAULT_SETTINGS, isLoading: false });
  },

  exportData: async () => {
    return await settingsRepository.exportAllData();
  },

  importData: async (payload: ExportDataPayload) => {
    set({ isLoading: true });
    await settingsRepository.importData(payload);
    const updated = await settingsRepository.getSettings();
    set({ settings: updated, isLoading: false });
  },
}));
