import React from 'react';
import { Download, RefreshCw, User, Filter, ArrowRight } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
  onSaveAndRead: () => void; // New prop
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, onSaveAndRead }) => {
  const handleDownload = () => {
    const content = `User Persona:\n${result.persona}\n\nNatural Language Filter:\n${result.naturalLanguageFilter}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-tech-filter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-full mb-4">
          <Filter className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">过滤器已生成</h2>
        <p className="text-gray-400">基于您的阅读偏好构建的专属模型</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {result.tags.map((tag, i) => (
          <span key={i} className="px-3 py-1 bg-brand-500/20 text-brand-300 text-sm rounded-full border border-brand-500/20">
            #{tag}
          </span>
        ))}
      </div>

      <div className="grid gap-6">
        {/* Persona Card */}
        <div className="bg-dark-800/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">用户心理画像</h3>
          </div>
          <div className="prose prose-invert prose-p:text-gray-300 max-w-none leading-relaxed whitespace-pre-line">
            {result.persona}
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-dark-800/50 border border-brand-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_20px_rgba(14,165,233,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-purple-500"></div>
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-brand-400" />
            <h3 className="text-xl font-semibold text-white">自然语言过滤器</h3>
          </div>
          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-gray-300 border border-white/5 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
            {result.naturalLanguageFilter}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
        <button
          onClick={onSaveAndRead}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-brand-900/50 hover:shadow-brand-500/20 animate-pulse"
        >
          <span>启用此过滤器并阅读</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
        >
          <Download className="w-5 h-5" />
          下载文本
        </button>
        
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-6 py-3 rounded-xl font-medium transition-all border border-white/5"
        >
          <RefreshCw className="w-5 h-5" />
          重新训练
        </button>
      </div>
    </div>
  );
};

export default ResultsView;