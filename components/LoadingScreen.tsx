import React from 'react';
import { Loader2, Sparkles, Rss } from 'lucide-react';

interface LoadingScreenProps {
  mode: 'fetching' | 'analyzing';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ mode }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 animate-pulse"></div>
        <div className="relative bg-dark-800 p-6 rounded-2xl border border-white/5 shadow-2xl">
          {mode === 'fetching' ? (
            <Rss className="w-10 h-10 text-brand-400 animate-pulse" />
          ) : (
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
          )}
        </div>
      </div>
      
      <h2 className="mt-8 text-xl font-medium text-white">
        {mode === 'fetching' ? '正在同步全球 RSS 科技源...' : 'AI 正在构建您的思维模型...'}
      </h2>
      <p className="mt-2 text-gray-400 text-sm">
        {mode === 'fetching' ? '抓取 Wired, The Verge, TechCrunch 等实时资讯并进行翻译' : '分析阅读偏好与潜在兴趣点'}
      </p>

      {mode === 'analyzing' && (
        <div className="mt-6 flex items-center gap-2 text-xs text-brand-300/70 uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini 3 Flash
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;