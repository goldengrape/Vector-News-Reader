export interface NewsItem {
  id: string;
  source: string;
  title: string;
  summary: string;
  category: string;
  link?: string;
}

export interface FilteredNewsItem extends NewsItem {
  matchScore?: number; // 0-100 relevance
  passReason?: string; // Why it passed the filter
}

export type VoteType = 'like' | 'dislike' | null;

export interface VoteRecord {
  itemId: string;
  item: NewsItem;
  vote: VoteType;
}

export interface AnalysisResult {
  persona: string;
  naturalLanguageFilter: string;
  tags: string[];
}

export enum AppState {
  LOADING_NEWS,
  FEED,
  ANALYZING,
  RESULT,
  ERROR
}

export type AppView = 'reader' | 'generator' | 'settings';

export type Language = 'zh' | 'en' | 'ja' | 'ko';

export interface Settings {
  apiKey: string;
  modelId: string;
  language: Language;
}

export const AVAILABLE_MODELS = [
  { id: "gemini-3-flash-preview", name: "Gemini 3.0 Flash (Fast & Balanced)" },
  { id: "gemini-3-pro-preview", name: "Gemini 3.0 Pro (High Intelligence)" },
  { id: "gemini-2.5-flash-latest", name: "Gemini 2.5 Flash (Stable)" }
];

export const SUPPORTED_LANGUAGES: { code: Language; name: string; promptName: string }[] = [
  { code: 'zh', name: '简体中文 (Chinese)', promptName: 'Simplified Chinese' },
  { code: 'en', name: 'English', promptName: 'English' },
  { code: 'ja', name: '日本語 (Japanese)', promptName: 'Japanese' },
  { code: 'ko', name: '한국어 (Korean)', promptName: 'Korean' }
];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  modelId: "gemini-3-flash-preview",
  language: "zh"
};

export const SOURCES = [
  "TechCrunch", "The Verge", "Wired", "Ars Technica", "Engadget", 
  "CNET", "VentureBeat", "ScienceAlert", "MIT Tech Review", 
  "IEEE Spectrum", "Scientific American", "Nature News", 
  "The Next Web", "Mashable", "Fast Company", "Business Insider"
];