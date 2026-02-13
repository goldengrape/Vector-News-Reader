import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNewsBatch, analyzeUserPreferences } from './services/geminiService';
import { NewsItem, VoteRecord, AppState, VoteType, AnalysisResult, AppView } from './types';
import NewsCard from './components/NewsCard';
import ResultsView from './components/ResultsView';
import SmartReader from './components/SmartReader';
import SettingsView from './components/SettingsView';
import LoadingScreen from './components/LoadingScreen';
import { Radio, Cpu, Loader2, Sparkles, BookOpen, FlaskConical, Save, X, Settings } from 'lucide-react';

const BATCH_SIZE = 10;
const MIN_VOTES = 10;

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('reader');
  
  // Generator State
  const [appState, setAppState] = useState<AppState>(AppState.LOADING_NEWS);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [preloadedNews, setPreloadedNews] = useState<NewsItem[] | null>(null);
  const [fetchPageIndex, setFetchPageIndex] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter State (Persistent)
  const [savedFilter, setSavedFilter] = useState<string>("");
  const [showFilterEditor, setShowFilterEditor] = useState(false);
  const [tempFilterInput, setTempFilterInput] = useState("");

  // Load saved filter on mount
  useEffect(() => {
    const saved = localStorage.getItem('techPulse_NLF');
    if (saved) {
      setSavedFilter(saved);
      setCurrentView('reader');
    } else {
      setCurrentView('generator'); // Default to generator if no filter
    }
  }, []);

  // Generator Logic: Initial Load
  useEffect(() => {
    // Only fetch for generator if we are in generator view
    if (currentView !== 'generator') return;

    let isMounted = true;
    setErrorMsg(null);
    const init = async () => {
      try {
        if (news.length === 0) {
            setAppState(AppState.LOADING_NEWS);
            // 1. Fetch First Batch
            const firstBatch = await fetchNewsBatch(BATCH_SIZE, 0);
            if (!isMounted) return;
            setNews(firstBatch);
            setFetchPageIndex(1);
            setAppState(AppState.FEED);
            
            // 2. Preload
            try {
                const secondBatch = await fetchNewsBatch(BATCH_SIZE, 1);
                if (isMounted) setPreloadedNews(secondBatch);
                if (isMounted) setFetchPageIndex(2);
            } catch (bgError) { console.warn(bgError); }
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error(error);
        setErrorMsg(error.message || "初始化新闻流失败");
        setAppState(AppState.ERROR);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [currentView, sessionKey]);

  // --- Handlers ---

  const handleVote = useCallback((id: string, type: VoteType) => {
    const item = news.find(n => n.id === id);
    if (!item) return;
    setVotes(prev => {
        const idx = prev.findIndex(v => v.itemId === id);
        let next = [...prev];
        if (idx >= 0) {
            type === null ? next.splice(idx, 1) : next[idx] = { itemId: id, item, vote: type };
        } else if (type !== null) {
            next.push({ itemId: id, item, vote: type });
        }
        return next;
    });
  }, [news]);

  const handleAnalyze = async () => {
    if (votes.length < MIN_VOTES) return;
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    try {
      const result = await analyzeUserPreferences(votes);
      setAnalysisResult(result);
      setAppState(AppState.RESULT);
    } catch (error: any) {
      setErrorMsg(error.message || "分析失败");
      setAppState(AppState.ERROR);
    }
  };

  const handleSaveAndRead = () => {
    if (analysisResult) {
      localStorage.setItem('techPulse_NLF', analysisResult.naturalLanguageFilter);
      localStorage.setItem('techPulse_Persona', analysisResult.persona);
      setSavedFilter(analysisResult.naturalLanguageFilter);
      setCurrentView('reader');
    }
  };

  const handleManualSaveFilter = () => {
    localStorage.setItem('techPulse_NLF', tempFilterInput);
    setSavedFilter(tempFilterInput);
    setShowFilterEditor(false);
    setCurrentView('reader');
  };

  const handleLoadMoreGenerator = async () => {
    // Reuse the previous logic for brevity in this complex file
    setErrorMsg(null);
    try {
        if (preloadedNews && preloadedNews.length > 0) {
        setNews(prev => [...prev, ...preloadedNews.filter(n => !prev.some(p => p.id === n.id))]);
        setPreloadedNews(null);
        const nextIdx = fetchPageIndex;
        setFetchPageIndex(p => p + 1);
        fetchNewsBatch(BATCH_SIZE, nextIdx).then(setPreloadedNews).catch(console.warn);
        } else {
        setIsLoadingMore(true);
        const batch = await fetchNewsBatch(BATCH_SIZE, fetchPageIndex);
        setNews(prev => [...prev, ...batch.filter(n => !prev.some(p => p.id === n.id))]);
        setFetchPageIndex(p => p + 1);
        }
    } catch (error: any) {
        // Show error but don't crash whole app if just loading more fails
        setErrorMsg(error.message || "加载更多失败");
    } finally {
        setIsLoadingMore(false);
    }
  };

  const handleResetGenerator = () => {
    setVotes([]);
    setNews([]);
    setPreloadedNews(null);
    setFetchPageIndex(0);
    setAnalysisResult(null);
    setSessionKey(p => p + 1);
    setAppState(AppState.LOADING_NEWS);
    setErrorMsg(null);
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans selection:bg-brand-500/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Navigation Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-white/5 sticky top-0 bg-dark-900/95 backdrop-blur-md z-20 pt-4 gap-4 transition-all">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start group">
            <div className="p-2 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors">
                <Radio className="w-6 h-6 text-brand-500" />
            </div>
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent cursor-pointer tracking-tight" onClick={() => setCurrentView('reader')}>
                Vector
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium hidden md:block">
                    Precision News Radar
                </p>
            </div>
            <button 
                onClick={() => setCurrentView('settings')}
                className="md:hidden p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white"
            >
                <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl w-full md:w-auto shadow-inner border border-white/5">
             <button 
                onClick={() => setCurrentView('reader')}
                className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentView === 'reader' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">深度阅读</span>
                <span className="sm:hidden">阅读</span>
             </button>
             <button 
                onClick={() => setCurrentView('generator')}
                className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentView === 'generator' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
                <FlaskConical className="w-4 h-4" />
                <span className="hidden sm:inline">偏好实验室</span>
                <span className="sm:hidden">实验室</span>
             </button>
             <button 
                onClick={() => setCurrentView('settings')}
                className={`hidden md:flex justify-center items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentView === 'settings' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="API与模型设置"
             >
                <Settings className="w-4 h-4" />
             </button>
          </div>
        </header>

        {/* Global Error Message Display */}
        {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                <div className="p-1 bg-red-500/20 rounded-full text-red-400">
                    <X className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <h4 className="text-red-400 font-medium text-sm mb-1">系统消息</h4>
                    <p className="text-gray-400 text-sm">{errorMsg}</p>
                </div>
                <button 
                    onClick={() => setErrorMsg(null)}
                    className="text-gray-500 hover:text-white text-xs underline"
                >
                    关闭
                </button>
            </div>
        )}

        {/* View: Settings */}
        {currentView === 'settings' && (
            <SettingsView onBack={() => setCurrentView(savedFilter ? 'reader' : 'generator')} />
        )}

        {/* View: Smart Reader */}
        {currentView === 'reader' && (
           <>
             {!savedFilter ? (
               <div className="text-center py-24 bg-dark-800/30 rounded-3xl border border-white/5 animate-fade-in backdrop-blur-sm">
                 <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20"></div>
                    <Radio className="w-16 h-16 text-brand-500 relative z-10" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-3">信号尚未校准</h2>
                 <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                   Vector 需要了解您的认知偏好，才能从全球科技噪音中提取高价值信息。
                 </p>
                 <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
                    <button onClick={() => setCurrentView('generator')} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20">
                      开始校准 (进入实验室)
                    </button>
                    <button onClick={() => { setTempFilterInput(""); setShowFilterEditor(true); }} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5">
                      手动输入指令
                    </button>
                 </div>
               </div>
             ) : (
               <SmartReader 
                  nlf={savedFilter} 
                  onEditFilter={() => {
                     setTempFilterInput(savedFilter);
                     setShowFilterEditor(true);
                  }}
               />
             )}
           </>
        )}

        {/* View: Generator (Filter Lab) */}
        {currentView === 'generator' && (
          <main className="relative min-h-[500px]">
            {/* Generator States */}
            {appState === AppState.LOADING_NEWS && news.length === 0 && <LoadingScreen mode="fetching" />}
            {appState === AppState.ANALYZING && <LoadingScreen mode="analyzing" />}
            
            {/* Error State Specific UI */}
            {appState === AppState.ERROR && !errorMsg && (
                <div className="text-center py-20 opacity-50">
                    <p className="text-gray-400">出现未知错误，请检查网络或配置。</p>
                    <button onClick={() => setCurrentView('settings')} className="mt-4 text-brand-400 underline">检查 API 配置</button>
                </div>
            )}

            {appState === AppState.RESULT && analysisResult && (
                <ResultsView 
                    result={analysisResult} 
                    onReset={handleResetGenerator} 
                    onSaveAndRead={handleSaveAndRead}
                />
            )}
            
            {/* Feed for Generator */}
            {(appState === AppState.FEED || (appState === AppState.LOADING_NEWS && news.length > 0)) && (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between px-2 mb-2 bg-brand-900/20 p-3 rounded-lg border border-brand-500/10">
                        <span className="text-xs text-brand-300 font-mono flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            校准模式：请对以下内容进行判定
                        </span>
                        <div className="text-xs text-gray-500 font-mono">
                            样本量: <span className="text-brand-400 font-bold">{votes.length}</span>/{MIN_VOTES}
                        </div>
                    </div>
                    {news.map((item) => (
                        <NewsCard
                        key={item.id}
                        item={item}
                        currentVote={votes.find(v => v.itemId === item.id)?.vote || null}
                        onVote={handleVote}
                        />
                    ))}
                    {/* Load More for Generator */}
                    <div className="pt-8 pb-12 text-center">
                        {isLoadingMore ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                        ) : (
                            <div className="flex flex-col gap-4 items-center">
                                <button onClick={handleLoadMoreGenerator} className="px-8 py-3 bg-dark-800 hover:bg-dark-700 border border-white/10 rounded-full text-gray-300 transition-colors">
                                    加载更多训练样本
                                </button>
                                {votes.length >= MIN_VOTES && (
                                    <button onClick={handleAnalyze} className="w-full max-w-xs px-8 py-3 bg-gradient-to-r from-brand-500 to-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-brand-500/20 animate-fade-in flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                        <Cpu className="w-5 h-5" /> 生成过滤器
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
          </main>
        )}

        {/* Filter Editor Modal */}
        {showFilterEditor && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                             <h3 className="text-lg font-semibold text-white">System Prompt (过滤器指令)</h3>
                        </div>
                        <button onClick={() => setShowFilterEditor(false)} className="text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 flex-1 overflow-hidden flex flex-col">
                        <textarea 
                            value={tempFilterInput}
                            onChange={(e) => setTempFilterInput(e.target.value)}
                            placeholder="在此处粘贴您的 System Prompt..."
                            className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-brand-500/50 resize-none custom-scrollbar leading-relaxed"
                        />
                        <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
                            <p>支持 Markdown 格式指令</p>
                            <p className="opacity-50">Vector Core v1.0</p>
                        </div>
                    </div>
                    <div className="p-4 border-t border-white/5 flex justify-end gap-3">
                        <button onClick={() => setShowFilterEditor(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">取消</button>
                        <button onClick={handleManualSaveFilter} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-brand-500/10 transition-all">
                            <Save className="w-4 h-4" /> 保存并应用
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;