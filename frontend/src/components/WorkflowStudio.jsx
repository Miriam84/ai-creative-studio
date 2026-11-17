import React, { useState } from 'react';
import { Workflow, Sparkles, Video, Mic, CheckCircle, ArrowRight, Play, Download, RefreshCw } from 'lucide-react';

export default function WorkflowStudio({ hardwareInfo }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const steps = [
    { num: 1, title: 'Imatge Base', desc: 'Concepte o foto original', icon: Sparkles, color: 'text-pink-400' },
    { num: 2, title: 'Magnific 4K', desc: 'Al·lucinació de porus i detalls', icon: Sparkles, color: 'text-pink-400' },
    { num: 3, title: 'Higgsfield Video', desc: 'Càmera 3D i moviment', icon: Video, color: 'text-purple-400' },
    { num: 4, title: 'ElevenLabs Audio', desc: 'Veu expressiva i efectes SFX', icon: Mic, color: 'text-emerald-400' },
  ];

  const handleRunPipeline = () => {
    setIsProcessing(true);
    setCurrentStep(2);
    setTimeout(() => {
      setCurrentStep(3);
      setTimeout(() => {
        setCurrentStep(4);
        setTimeout(() => {
          setIsProcessing(false);
          setCompleted(true);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          Pipeline Complet <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">End-to-End Automation</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Executa tot el procés en cadena: Agafa una imatge de baixa resolució, reescala-la amb Magnific, converteix-la en vídeo amb Higgsfield i afegeix-hi veu i so amb ElevenLabs.
        </p>
      </div>

      {/* Steps Visual Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = completed || currentStep > s.num;
          const isCurrent = isProcessing && currentStep === s.num;
          return (
            <div
              key={s.num}
              className={`p-4 rounded-xl border flex items-center gap-3 transition ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : isCurrent
                  ? 'bg-indigo-600/20 border-indigo-500 text-white animate-pulse'
                  : 'bg-studio-card border-studio-cardBorder text-slate-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                isDone ? 'bg-emerald-500 text-black' : isCurrent ? 'bg-indigo-500 text-white' : 'bg-studio-bg text-slate-400'
              }`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <div>
                <span className="text-xs font-bold block">{s.title}</span>
                <span className="text-[10px] text-slate-500">{s.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Composite Card */}
      <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 relative flex items-center justify-center">
          {completed ? (
            <video
              src="https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-woman-in-a-futuristic-cyberpunk-environment-42475-large.mp4"
              autoPlay
              loop
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 flex flex-col items-center">
              <Workflow className="w-12 h-12 text-indigo-400/60 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-white">Projecte Mestre Multimèdia</span>
              <span className="text-xs text-slate-400 mt-1 max-w-xs">
                Prem "Iniciar Pipeline Automàtic" per processar Imatge + Vídeo + Veu d'una sola tirada.
              </span>
            </div>
          )}
        </div>

        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-studio-bg border border-studio-cardBorder text-xs flex flex-col gap-2">
            <span className="font-bold text-slate-200">Paràmetres del Pipeline:</span>
            <div className="flex justify-between text-slate-400">
              <span>Magnific:</span>
              <span className="text-pink-400">4x Upscale + 60% Detall</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Higgsfield:</span>
              <span className="text-purple-400">Dolly Zoom + 24 FPS</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ElevenLabs:</span>
              <span className="text-emerald-400">Veu Adam + Foley SFX</span>
            </div>
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={isProcessing}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xl ${
              isProcessing
                ? 'bg-slate-700 text-slate-400'
                : 'bg-gradient-to-r from-pink-500 via-purple-600 to-emerald-500 text-white shadow-indigo-500/25'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Processant Pas {currentStep} de 4...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Pipeline Automàtic</span>
              </>
            )}
          </button>

          {completed && (
            <a
              href="https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-woman-in-a-futuristic-cyberpunk-environment-42475-large.mp4"
              download="final-master.mp4"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Master Final (Vídeo + Veu)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
