import { Settings, DEFAULT_SETTINGS } from "../types";

const STORAGE_KEY = 'neuralFilter_settings';

export const saveSettings = (settings: Settings) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
};

export const getSettings = (): Settings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  
  try {
    const parsed = JSON.parse(saved);
    // Merge with default settings to ensure new fields (like language) exist if loading old config
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};