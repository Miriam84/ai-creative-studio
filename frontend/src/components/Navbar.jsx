import React from 'react';
import { Sparkles, Video, Mic, Workflow, Cpu, Layers, Smartphone } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, hardwareInfo }) {
  const tabs = [
    { id: 'avatar', label: 'Avatar Studio', icon: Smartphone, color: 'text-cyan-400', badge: 'HeyGen Free' },
    { id: 'magnific', label: 'Magnific Studio', icon: Sparkles, color: 'text-pink-400', badge: 'Upscale & Detail' },
    { id: 'higgsfield', label: 'Higgsfield Studio', icon: Video, color: 'text-purple-400', badge: 'Video & Camera' },
    { id: 'elevenlabs', label: 'ElevenLabs Studio', icon: Mic, color: 'text-emerald-400', badge: 'Voice & SFX' },
    { id: 'workflow', label: 'Full Pipeline', icon: Workflow, color: 'text-indigo-400', badge: 'All-in-One' },
    { id: 'hardware', label: 'Hardware & Multi-PC', icon: Cpu, color: 'text-amber-400', badge: hardwareInfo?.profile || 'Detecting' },
  ];

  return (
    <header className="border-b border-studio-cardBorder bg-studio-bg/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-emerald-400 p-[2px] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-studio-bg rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                OmniStudio
              </span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0 Local
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Magnific + Higgsfield + ElevenLabs Hybrid Suite
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-studio-card border border-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-studio-card/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
                {tab.id === 'hardware' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    hardwareInfo?.profile === 'PRO'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {hardwareInfo?.vram_gb ? `${hardwareInfo.vram_gb}GB` : 'GPU'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
