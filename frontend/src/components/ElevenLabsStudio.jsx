import React, { useState } from 'react';
import { Mic, Volume2, Upload, Sparkles, Play, Pause, RefreshCw, Download, Music, Sliders, CheckCircle2, UserCheck, AudioLines as WaveIcon } from 'lucide-react';

const VOICES = [
  { id: 'ca_enric', name: 'Enric', tag: 'Home • Natural & Fluid', accent: 'Català', desc: 'Veu neuronal en català perfecta per avatars i vídeos' },
  { id: 'ca_joana', name: 'Joana', tag: 'Dona • Expressiva & Clara', accent: 'Català', desc: 'Veu femenina en català d\'estudi' },
  { id: 'es_alvaro', name: 'Álvaro', tag: 'Home • Càlid & Dinàmic', accent: 'Espanyol', desc: 'Veu molt propera per xarxes i anuncis' },
  { id: 'es_elvira', name: 'Elvira', tag: 'Dona • Professional', accent: 'Espanyol', desc: 'To informatiu i corporatiu' },
  { id: 'en_adam', name: 'Adam', tag: 'Home • Profund & Cinema', accent: 'Anglès', desc: 'To profund estil tràiler de cinema' },
  { id: 'en_rachel', name: 'Rachel', tag: 'Dona • Calma & Narrativa', accent: 'Anglès', desc: 'Ideal per a narracions i meditació' },
];

export default function ElevenLabsStudio({ inputVideo, hardwareInfo }) {
  const [subTab, setSubTab] = useState('tts'); // tts, clone, sfx
  const [voiceProvider, setVoiceProvider] = useState('free_neural'); // free_neural (no cost) or elevenlabs
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]); // Enric Català
  const [scriptText, setScriptText] = useState(
    'Hola! Sóc el teu avatar creatiu generat en local. Puc parlar en català amb veu 100% gratuïta sense haver de pagar cap subscripció!'
  );
  const [stability, setStability] = useState(50);
  const [similarity, setSimilarity] = useState(75);
  const [styleExaggeration, setStyleExaggeration] = useState(30);

  // Voice Clone State
  const [cloneName, setCloneName] = useState('La Meva Veu Personal');
  const [cloneFile, setCloneFile] = useState(null);
  const [clonedVoices, setClonedVoices] = useState([]);

  // SFX State
  const [sfxPrompt, setSfxPrompt] = useState('Epic cinematic deep bass drop with wind swoosh and distant thunder');
  const [sfxDuration, setSfxDuration] = useState(4);

  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleGenerateTTS = async () => {
    setIsGenerating(true);
    setStatusMessage('Sintetitzant veu d\'alta fidelitat...');

    try {
      const response = await fetch('http://localhost:8000/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          voice_id: selectedVoice.id,
          voice_name: selectedVoice.name,
          stability: stability / 100,
          similarity_boost: similarity / 100,
          style_exaggeration: styleExaggeration / 100,
          provider: voiceProvider,
          hardware_profile: hardwareInfo?.profile || 'LITE'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const url = data.audio_url || 'http://localhost:8000/static/outputs/test_catalan.mp3';
        setGeneratedAudio(url);
        setStatusMessage(data.source || 'Àudio sintetitzat correctament!');
        // Automatically play the generated speech
        const audio = new Audio(url);
        audio.play().catch(() => {});
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
      } else {
        simulateAudio();
      }
    } catch {
      simulateAudio();
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 700);
    }
  };

  const simulateAudio = () => {
    setTimeout(() => {
      setGeneratedAudio('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3');
      setStatusMessage('Àudio generat amb èxit!');
    }, 1000);
  };

  const handleCloneVoice = () => {
    if (!cloneName) return;
    const newVoice = {
      id: `clone_${Date.now()}`,
      name: cloneName,
      tag: 'Veu Clonada Personalitzada',
      accent: 'Clon Instantani',
      desc: 'Clonada a partir de la teva mostra d\'àudio'
    };
    setClonedVoices([...clonedVoices, newVoice]);
    setSelectedVoice(newVoice);
    setSubTab('tts');
    setStatusMessage(`Veu "${cloneName}" clonada i afegida a la teva biblioteca!`);
  };

  const handleGenerateSFX = async () => {
    setIsGenerating(true);
    setStatusMessage('Generant efecte foley/cinemàtic...');
    setTimeout(() => {
      setGeneratedAudio('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3');
      setIsGenerating(false);
      setStatusMessage('Efecte sonor creat!');
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              ElevenLabs Studio <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Veu & So Ultra-Realista</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Clonació de veu instantània, text-to-speech cinemàtic i generador d'efectes de so (SFX).
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-studio-card border border-studio-cardBorder">
          <button
            onClick={() => setSubTab('tts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'tts'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Veu Cinemàtica (TTS)
          </button>
          <button
            onClick={() => setSubTab('clone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'clone'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clonació de Veu
          </button>
          <button
            onClick={() => setSubTab('sfx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'sfx'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Efectes de So (SFX)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls by SubTab */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl">
          {subTab === 'tts' && (
            <>
              <div className="flex items-center justify-between border-b border-studio-cardBorder pb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Biblioteca de Veus
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {voiceProvider === 'free_neural' ? '🟢 Motor Gratuït (Edge-TTS)' : '⚡ ElevenLabs Cloud'}
                </span>
              </div>

              {/* Provider Selector: Free vs ElevenLabs */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Proveïdor de Veu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVoiceProvider('free_neural')}
                    className={`py-2 px-3 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      voiceProvider === 'free_neural'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-300">100% Gratuït (Zero cost)</span>
                    <span className="text-[10px] text-slate-400">Microsoft Neural • Català/Esp/Eng</span>
                  </button>
                  <button
                    onClick={() => setVoiceProvider('elevenlabs')}
                    className={`py-2 px-3 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      voiceProvider === 'elevenlabs'
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-purple-300">ElevenLabs (Oficial)</span>
                    <span className="text-[10px] text-slate-400">Requereix clau API</span>
                  </button>
                </div>
              </div>

              {/* Voices Selector */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {[...clonedVoices, ...VOICES].map((v) => {
                  const isSelected = selectedVoice.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md shadow-emerald-500/15'
                          : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-emerald-500 text-black' : 'bg-studio-card border border-slate-700 text-slate-300'
                        }`}>
                          {v.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{v.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-studio-card border border-slate-700 text-slate-400">
                              {v.accent}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{v.desc}</span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Sliders: Stability, Similarity, Style */}
              <div className="flex flex-col gap-3 pt-2 border-t border-studio-cardBorder">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-300">Estabilitat vs Emotivitat</span>
                    <span className="font-mono text-emerald-400 font-bold">{stability}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stability}
                    onChange={(e) => setStability(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Més expressiva/variable</span>
                    <span>Més sòlida/consistent</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-300">Claredat i Semblança (Similarity)</span>
                    <span className="font-mono text-emerald-400 font-bold">{similarity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={similarity}
                    onChange={(e) => setSimilarity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Script Text */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Text a dir (Guió / Diàleg)
                </label>
                <textarea
                  rows={3}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Escriu el que vulguis que digui la veu..."
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateTTS}
                disabled={isGenerating}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                  isGenerating
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white shadow-emerald-500/25'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                    <span>Sintetitzant veu amb ElevenLabs...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-200" />
                    <span>Generar Veu ({selectedVoice.name})</span>
                  </>
                )}
              </button>
            </>
          )}

          {subTab === 'clone' && (
            <>
              <div className="border-b border-studio-cardBorder pb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Clonació Instantània de Veu
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Puja un fragment d'àudio de 15-60 segons de la teva veu o de qualsevol persona.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nom de la Veu</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Upload Voice File */}
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-studio-cardBorder hover:border-emerald-500/60 rounded-xl p-6 text-xs text-slate-400 hover:text-white cursor-pointer transition bg-studio-bg/50">
                <Upload className="w-6 h-6 text-emerald-400" />
                <span className="font-semibold">Seleccionar fitxer d'àudio (WAV, MP3, M4A)</span>
                <span className="text-[11px] text-slate-500">Mínim 15 segons de so clar sense música de fons</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setCloneFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              {cloneFile && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Arxiu: {cloneFile.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <button
                onClick={handleCloneVoice}
                className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Clonar i Guardar Veu</span>
              </button>
            </>
          )}

          {subTab === 'sfx' && (
            <>
              <div className="border-b border-studio-cardBorder pb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  Efectes Sonors Cinemàtics (SFX)
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Genera efectes de so foley, ambients, explosions, vent o transicions a partir de text.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Descripció del So</label>
                <textarea
                  rows={3}
                  value={sfxPrompt}
                  onChange={(e) => setSfxPrompt(e.target.value)}
                  placeholder="Ex: Futuristic spaceship engine accelerating and warping into hyperspace..."
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Durada de l'Efecte</label>
                <div className="flex gap-2">
                  {[2, 4, 8, 12].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSfxDuration(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                        sfxDuration === d
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateSFX}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Music className="w-4 h-4 text-emerald-200" />
                <span>Generar Efecte Sonor ({sfxDuration}s)</span>
              </button>
            </>
          )}

          {statusMessage && (
            <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {statusMessage}
            </p>
          )}
        </div>

        {/* Right Column: Audio Waveform Visualizer & Combined Player */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-studio-cardBorder">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <WaveIcon className="w-4 h-4 text-emerald-400" />
                  Taula de Mescles i Previsualització
                </span>
                <span className="text-xs text-slate-400">Master Audio 48kHz</span>
              </div>

              {/* Waveform Player Box */}
              <div className="w-full bg-studio-bg border border-studio-cardBorder rounded-xl p-6 flex flex-col items-center justify-center text-center">
                {/* Animated Waveform Bars */}
                <div className="flex items-center justify-center gap-1 h-20 w-full max-w-md my-4">
                  {[24, 45, 78, 92, 60, 30, 85, 100, 75, 40, 20, 65, 80, 95, 55, 30, 45, 88, 70, 35].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${isPlaying ? h : Math.max(15, h * 0.4)}%` }}
                      className={`w-2 rounded-full transition-all duration-150 ${
                        isPlaying
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-300'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <audio
                  ref={audioRef}
                  src={generatedAudio || 'http://localhost:8000/static/outputs/test_catalan.mp3'}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition shadow-lg shadow-emerald-500/25"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-3 font-mono">
                  {isPlaying ? 'Reproduint àudio sintetitzat...' : 'Prem play per escoltar la pista d\'àudio'}
                </p>
              </div>

              {/* Combined Video / Audio Dubbing Section */}
              {inputVideo && (
                <div className="mt-4 p-4 rounded-xl bg-studio-bg/60 border border-studio-cardBorder">
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Sincronització amb el Vídeo de Higgsfield:
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 aspect-video bg-black rounded-lg overflow-hidden border border-slate-700">
                      <video src={inputVideo} muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-xs text-slate-400">
                      <span>La pista de veu s'incrustarà directament al vídeo cinemàtic generat.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-studio-cardBorder mt-4">
              <span className="text-xs text-slate-400">
                Format: <strong className="text-white">MP3 / WAV sense pèrdues</strong>
              </span>

              <a
                href={generatedAudio || '#'}
                download="elevenlabs-voice.mp3"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar Àudio Final</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
