import React, { useState, useEffect } from 'react';
import { Save, Key, Cpu, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { Settings, AVAILABLE_MODELS } from '../types';
import { getSettings, saveSettings } from '../services/settings';

interface SettingsViewProps {
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleChange = (field: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsValidating(true);
    // Simple validation could go here, for now just save
    setTimeout(() => {
        saveSettings(settings);
        setIsValidating(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }, 500);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-brand-400" />
            <span>AI 引擎配置</span>
        </h2>
        <p className="text-gray-400">配置您的专属 AI 接口密钥与模型偏好。数据仅存储在本地。</p>
      </div>

      <div className="space-y-6">
        {/* API Key Section */}
        <div className="bg-dark-800/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
                <Key className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2">Google Gemini API Key</h3>
                <p className="text-sm text-gray-500 mb-4">
                    为了获得更高配额和更稳定的体验，建议使用您自己的付费或免费 API Key。
                    <br/>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300 underline">
                        点击此处获取 API Key
                    </a>
                </p>
                <div className="relative">
                    <input 
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        placeholder="在此粘贴您的 API Key (AIzaSy...)"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono text-sm"
                    />
                    <div className="absolute right-3 top-3.5 text-gray-500">
                        <ShieldCheck className="w-5 h-5 opacity-50" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-dark-800/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Cpu className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2">推理模型选择</h3>
                <p className="text-sm text-gray-500 mb-4">
                    不同的模型在速度和推理深度上有所不同。推荐使用 Gemini 3.0 系列。
                </p>
                <div className="grid gap-3">
                    {AVAILABLE_MODELS.map(model => (
                        <label 
                            key={model.id}
                            className={`
                                flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                                ${settings.modelId === model.id 
                                    ? 'bg-brand-500/10 border-brand-500/50' 
                                    : 'bg-black/20 border-white/5 hover:bg-white/5'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <input 
                                    type="radio" 
                                    name="model"
                                    value={model.id}
                                    checked={settings.modelId === model.id}
                                    onChange={() => handleChange('modelId', model.id)}
                                    className="text-brand-500 focus:ring-brand-500 bg-transparent border-gray-600"
                                />
                                <span className={`text-sm font-medium ${settings.modelId === model.id ? 'text-white' : 'text-gray-400'}`}>
                                    {model.name}
                                </span>
                            </div>
                            {settings.modelId === model.id && <Check className="w-4 h-4 text-brand-400" />}
                        </label>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-4 gap-4">
            <button 
                onClick={onBack}
                className="px-6 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                返回
            </button>
            <button 
                onClick={handleSave}
                className={`
                    flex items-center gap-2 px-8 py-2.5 rounded-lg font-medium transition-all shadow-lg
                    ${isSaved 
                        ? 'bg-green-600 text-white shadow-green-500/20' 
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20'}
                `}
            >
                {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isSaved ? '已保存配置' : '保存更改'}
            </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/10 rounded-xl flex items-start gap-3 text-sm text-yellow-500/80">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
                如果您遇到 "Quota Exceeded (429)" 错误，通常是因为默认的共享 Key 额度耗尽。配置您自己的 Key 可以立即解决此问题。
            </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;