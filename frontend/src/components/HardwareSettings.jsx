import React, { useState } from 'react';
import { Cpu, Server, Key, Copy, Check, HardDrive, ShieldCheck, Zap, MonitorPlay } from 'lucide-react';

export default function HardwareSettings({ hardwareInfo, setHardwareInfo }) {
  const [profile, setProfile] = useState(hardwareInfo?.profile || 'LITE');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveKeys = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyBash = () => {
    navigator.clipboard.writeText('git clone https://github.com/Miriam84/ai-creative-studio.git\ncd ai-creative-studio\n./start.bat');
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          Gestor de Maquinari & Ús Multi-PC <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Portabilitat Total</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configura els perfils de rendiment segons la GPU de l'ordinador on l'executis (portàtil vs PC potent).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hardware Detection Box */}
        <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-studio-cardBorder pb-3">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Maquinari Detectat en aquest Equip
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Actiu
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder">
              <span className="text-slate-400">Targeta Gràfica (GPU):</span>
              <span className="font-bold text-white">{hardwareInfo?.gpu_name || 'NVIDIA GeForce RTX 3050 Laptop'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder">
              <span className="text-slate-400">Memòria de Vídeo (VRAM):</span>
              <span className="font-bold text-amber-300">{hardwareInfo?.vram_gb || 4} GB GDDR6</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder">
              <span className="text-slate-400">Memòria RAM del Sistema:</span>
              <span className="font-bold text-slate-200">16 GB</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder">
              <span className="text-slate-400">Perfil d'Execució Recomanat:</span>
              <span className="font-bold text-pink-400">Mode Lite / Tiled Diffusion</span>
            </div>
          </div>

          {/* Profile Switcher */}
          <div className="pt-2 border-t border-studio-cardBorder">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Seleccionar Perfil d'Execució:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setProfile('LITE')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  profile === 'LITE'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/15'
                    : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Mode Lite (4-8 GB)</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] text-slate-400">Optimitzat per a portàtils. Tessel·lació i models ràpids.</span>
              </button>

              <button
                onClick={() => setProfile('PRO')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  profile === 'PRO'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/15'
                    : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Mode Pro (16-24 GB)</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[10px] text-slate-400">Per a PC de sobretaula potent (SUPIR, Hunyuan, Wan 2.1).</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-PC Instructions Box */}
        <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-studio-cardBorder pb-3 mb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Com executar-la en un altre PC més potent
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Aquesta app està preparada per ser 100% portable. Pots clonar el repositori de GitHub en qualsevol altre ordinador (Windows o Linux amb NVIDIA RTX 3080/3090/4090):
            </p>

            <div className="bg-studio-bg border border-studio-cardBorder rounded-xl p-3 font-mono text-[11px] text-slate-300 relative group">
              <pre className="overflow-x-auto">
{`git clone https://github.com/Miriam84/ai-creative-studio.git
cd ai-creative-studio
start.bat`}
              </pre>
              <button
                onClick={copyBash}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-studio-card border border-slate-700 hover:border-slate-500 text-slate-300 transition"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
              <MonitorPlay className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Consell Pro:</strong> Pots tenir el PC potent encès com a servidor a la teva xarxa local i obrir la web des del portàtil entrant a la seva IP local (<code className="bg-black/40 px-1 py-0.5 rounded">http://192.168.1.XX:5173</code>).
              </span>
            </div>
          </div>

          {/* ElevenLabs API Key Settings */}
          <div className="pt-3 border-t border-studio-cardBorder">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Clau API d'ElevenLabs (Opcional per a la màxima fidelitat)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk_..."
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                className="flex-1 bg-studio-bg border border-studio-cardBorder rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveKeys}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition"
              >
                {saved ? 'Guardada!' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
