import React, { useState, useEffect, useRef } from 'react';
import { fetchNewsBatch, applyNaturalLanguageFilter } from '../services/geminiService';
import { FilteredNewsItem } from '../types';
import { Loader2, ExternalLink, RefreshCw, FilterX, Edit3, CheckCircle2 } from 'lucide-react';

interface SmartReaderProps {
  nlf: string;
  onEditFilter: () => void;
}

const PAGE_SIZE = 10;
const FETCH_BATCH_SIZE = 15; // Fetch slightly more raw items to improve filter hit rate efficiency

const SmartReader: React.FC<SmartReaderProps> = ({ nlf, onEditFilter }) => {
  const [displayedNews, setDisplayedNews] = useState<FilteredNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);
  
  // Refs for queue management
  const queueRef = useRef<FilteredNewsItem[]>([]);
  const pageIndexRef = useRef(0);
  const mountedRef = useRef(true);

  // Helper: Fetch a single batch and filter it
  const fetchAndFilterNextBatch = async (): Promise<FilteredNewsItem[]> => {
    try {
      const currentIdx = pageIndexRef.current;
      pageIndexRef.current += 1; // Increment for next time

      // 1. Fetch Raw (Translate & Summarize)
      const rawBatch = await fetchNewsBatch(FETCH_BATCH_SIZE, currentIdx);
      if (!mountedRef.current) return [];
      
      setScannedCount(prev => prev + rawBatch.length);

      // 2. Filter (Apply NLF)
      const passedBatch = await applyNaturalLanguageFilter(rawBatch, nlf);
      
      return passedBatch;
    } catch (error) {
      console.warn("Batch fetch failed", error);
      return [];
    }
  };

  // Logic: Fill queue until it has at least 'target' items
  const fillQueue = async (targetSize: number) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 6; // Avoid infinite loop

    while (queueRef.current.length < targetSize && attempts < MAX_ATTEMPTS && mountedRef.current) {
      const newItems = await fetchAndFilterNextBatch();
      
      // Deduplicate before adding to queue
      const existingIds = new Set(displayedNews.map(n => n.id));
      const queueIds = new Set(queueRef.current.map(n => n.id));
      
      const uniqueItems = newItems.filter(n => !existingIds.has(n.id) && !queueIds.has(n.id));
      queueRef.current = [...queueRef.current, ...uniqueItems];
      
      attempts++;
    }
  };

  // Background Preloader
  const triggerPreload = async () => {
    if (isPreloading) return; // Already preloading
    
    // If queue already has enough for next page, don't waste tokens
    if (queueRef.current.length >= PAGE_SIZE) return;

    setIsPreloading(true);
    await fillQueue(PAGE_SIZE); // Try to fill buffer for at least one next page
    if (mountedRef.current) setIsPreloading(false);
  };

  // User Action: Load More
  const handleLoadMore = async (initialLoad = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1. If initial load, reset everything
      if (initialLoad) {
        setDisplayedNews([]);
        queueRef.current = [];
        pageIndexRef.current = 0;
        setScannedCount(0);
      }

      // 2. Ensure we have enough items in queue for the View
      await fillQueue(PAGE_SIZE);

      // 3. Move items from Queue to Display
      if (mountedRef.current) {
        const nextBatch = queueRef.current.slice(0, PAGE_SIZE);
        queueRef.current = queueRef.current.slice(PAGE_SIZE);
        
        setDisplayedNews(prev => [...prev, ...nextBatch]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        // 4. Trigger background preload for the *next* interaction
        triggerPreload();
      }
    }
  };

  // Initial Mount
  useEffect(() => {
    mountedRef.current = true;
    handleLoadMore(true);
    return () => { mountedRef.current = false; };
  }, [nlf]);

  return (
    <div className="animate-fade-in pb-20">
      {/* Filter Status Header */}
      <div className="mb-8 p-4 bg-gradient-to-r from-brand-900/40 to-dark-800 rounded-xl border border-brand-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            智能过滤器已激活
          </h2>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
            <span>已扫描 {scannedCount} 条资讯</span>
            {isPreloading && (
              <span className="flex items-center gap-1 text-brand-400 text-xs bg-brand-400/10 px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                后台预加载中...
              </span>
            )}
            {!isPreloading && queueRef.current.length >= PAGE_SIZE && (
               <span className="flex items-center gap-1 text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">
                 <CheckCircle2 className="w-3 h-3" />
                 下页已就绪
               </span>
            )}
          </p>
        </div>
        <button 
          onClick={onEditFilter}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5"
        >
          <Edit3 className="w-3 h-3" />
          查看/编辑指令
        </button>
      </div>

      {/* News Feed */}
      <div className="space-y-6">
        
        {/* Initial Loading State */}
        {isLoading && displayedNews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-12 h-12 text-brand-400 animate-spin relative z-10" />
             </div>
             <h3 className="text-xl font-semibold text-white mb-2">正在执行您的 AI 过滤指令</h3>
             <p className="text-gray-400 max-w-sm mx-auto">
               系统正在实时扫描 RSS 源并应用您的自然语言过滤器...
             </p>
             <div className="mt-4 px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-brand-300 border border-brand-500/20">
                已扫描分析: {scannedCount} 条
             </div>
          </div>
        )}

        {displayedNews.map((item) => (
          <div key={item.id} className="group relative bg-dark-800/40 border border-white/5 hover:border-brand-500/30 rounded-2xl p-6 transition-all duration-300 hover:bg-dark-800/60 animate-fade-in">
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold tracking-wider uppercase rounded-full shadow-lg shadow-brand-500/20">
                {item.category}
              </span>
            </div>
            
            <div className="mt-2 mb-3">
              <h3 className="text-xl font-bold text-gray-100 leading-snug group-hover:text-brand-200 transition-colors">
                {item.title}
              </h3>
            </div>

            <p className="text-gray-400 leading-relaxed mb-4 text-sm">
              {item.summary}
            </p>

            {item.passReason && (
              <div className="mb-4 text-xs font-mono text-green-400/80 bg-green-900/10 px-3 py-2 rounded border border-green-500/10 flex items-start gap-2">
                <span className="shrink-0">🤖 命中规则:</span>
                <span>{item.passReason}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {item.source}
              </span>
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-400 hover:text-white text-sm font-medium transition-colors"
              >
                阅读全文 <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}

        {/* Empty State / Not Loading */}
        {!isLoading && displayedNews.length === 0 && (
          <div className="text-center py-20 opacity-50 animate-fade-in">
            <FilterX className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">当前的过滤器太严格了，暂未找到匹配新闻。</p>
            <p className="text-sm text-gray-600 mt-2">系统已尝试扫描了 {scannedCount} 条内容。</p>
            <button 
                onClick={() => handleLoadMore(false)}
                className="mt-4 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
                继续扫描
            </button>
          </div>
        )}

        {/* Load More Button */}
        {displayedNews.length > 0 && (
          <div className="pt-8 text-center">
            <button
              onClick={() => handleLoadMore(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-dark-800 hover:bg-dark-700 border border-white/10 rounded-full text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                  <span>AI 正在深入筛选 (Scanning)...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>加载更多 ({PAGE_SIZE}条)</span>
                  {queueRef.current.length >= PAGE_SIZE && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Ready</span>
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartReader;