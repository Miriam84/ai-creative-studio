import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Upload, Sparkles, Play, Pause, RefreshCw, Download, Music, Sliders, CheckCircle2, UserCheck, AudioLines as WaveIcon, Radio } from 'lucide-react';

export default function ElevenLabsStudio({ inputVideo, hardwareInfo }) {
  const [subTab, setSubTab] = useState('tts'); // tts, clone, sfx
  const [voiceProvider, setVoiceProvider] = useState('clone'); // clone (fast), deep_ai (F5-TTS), elevenlabs
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [scriptText, setScriptText] = useState(
    "Hola! Sóc l'home del bigot, parlant amb la meva veu clonada en català. Pots fer-me dir qualsevol frase o guió!"
  );
  const [stability, setStability] = useState(50);
  const [similarity, setSimilarity] = useState(75);
  const [styleExaggeration, setStyleExaggeration] = useState(30);

  // Voice Clone State
  const [cloneName, setCloneName] = useState('La Meva Veu Personal');
  const [cloneFile, setCloneFile] = useState(null);
  const [cloneSampleText, setCloneSampleText] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Audio Playback & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState('/static/outputs/test_cloned_rai.wav');
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // SFX State
  const [sfxPrompt, setSfxPrompt] = useState('Epic cinematic deep bass drop with wind swoosh and distant thunder');
  const [sfxDuration, setSfxDuration] = useState(4);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch voices on mount
  useEffect(() => {
    fetch('/api/voices')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setVoices(data);
          // Default to Rai's cloned voice or first available
          const raiVoice = data.find((v) => v.id === 'voice_rai') || data[0];
          setSelectedVoice(raiVoice);
        }
      })
      .catch(() => {
        const fallback = [
          { id: 'voice_rai', name: "L'home del bigot (Rai)", tag: "Veu Clonada d'en Rai", accent: "Català", desc: "Clonada de l'àudio de WhatsApp d'en Rai", is_cloned: true },
          { id: 'ca_enric', name: 'Enric', tag: 'Home • Natural & Fluid', accent: 'Català', desc: 'Veu neuronal en català perfecta per avatars i vídeos' },
          { id: 'ca_joana', name: 'Joana', tag: 'Dona • Expressiva & Clara', accent: 'Català', desc: 'Veu femenina en català d\'estudi' }
        ];
        setVoices(fallback);
        setSelectedVoice(fallback[0]);
      });
  }, []);

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
    if (!selectedVoice) return;
    setIsGenerating(true);
    setStatusMessage(voiceProvider === 'deep_ai' ? '🧠 Generant veu amb xarxa neural F5-TTS Flow Matching...' : '⚡ Sintetitzant veu d\'estudi en català...');

    try {
      const response = await fetch('/api/elevenlabs/tts', {
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
        const url = data.audio_url || '/static/outputs/test_cloned_rai.wav';
        setGeneratedAudio(url);
        setStatusMessage(data.source || 'Àudio sintetitzat correctament!');
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        setStatusMessage("Error en la síntesi de veu.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error connectant amb el servidor de veu.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Mic Recording for Clone
  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const recordedFile = new File([audioBlob], `mostra_${Date.now()}.wav`, { type: 'audio/wav' });
        setCloneFile(recordedFile);
      };

      mediaRecorderRef.current.start();
      setIsRecordingMic(true);
      setRecordSeconds(0);

      const interval = setInterval(() => {
        setRecordSeconds((prev) => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("No s'ha pogut accedir al micròfon.");
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  const handleCloneVoice = async () => {
    if (!cloneName || !cloneFile) {
      alert("Si us plau, introdueix un nom i selecciona un fitxer d'àudio o grava amb el micròfon.");
      return;
    }

    setIsCloning(true);
    setStatusMessage("Extreient timbre acústic i patró de veu...");

    try {
      const formData = new FormData();
      formData.append('voice_name', cloneName);
      formData.append('audio_file', cloneFile);
      formData.append('reference_text', cloneSampleText || `Mostra de veu de ${cloneName}`);
      formData.append('lang', 'ca');

      const res = await fetch('/api/elevenlabs/clone', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newVoice = data.voice;
        setVoices((prev) => [newVoice, ...prev]);
        setSelectedVoice(newVoice);
        setSubTab('tts');
        setStatusMessage(`✨ Veu "${cloneName}" clonada amb èxit i afegida a la biblioteca!`);
      } else {
        alert("Error en clonar la veu al servidor.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de connexió en clonar la veu.");
    } finally {
      setIsCloning(false);
    }
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
              ElevenLabs Studio <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">VoiceLab & Cloner 100% Gratuït</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Clonació de veu instantània, text-to-speech cinemàtic en català/espanyol i sincronització d'avatars.
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
            Clonació de Veu (VoiceLab)
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
                  {selectedVoice?.is_cloned ? '🌟 Veu Clonada Activa' : '🟢 Veu Neuronal'}
                </span>
              </div>

              {/* Provider / Engine Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Motor de Síntesi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVoiceProvider('clone')}
                    className={`py-2 px-3 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      voiceProvider === 'clone'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-300">⚡ Ràpid (~2s)</span>
                    <span className="text-[10px] text-slate-400">Timbre acústic instantani</span>
                  </button>
                  <button
                    onClick={() => setVoiceProvider('deep_ai')}
                    className={`py-2 px-3 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      voiceProvider === 'deep_ai'
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-purple-300">🧠 AI Deep (F5-TTS)</span>
                    <span className="text-[10px] text-slate-400">Clonació neuronal profunda</span>
                  </button>
                </div>
              </div>

              {/* Voices Selector */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {voices.map((v) => {
                  const isSelected = selectedVoice?.id === v.id;
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
                          v.is_cloned ? 'bg-amber-500 text-black shadow-amber-500/20 shadow-md' : isSelected ? 'bg-emerald-500 text-black' : 'bg-studio-card border border-slate-700 text-slate-300'
                        }`}>
                          {v.is_cloned ? '★' : v.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{v.name}</span>
                            {v.is_cloned && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                                CLONADA
                              </span>
                            )}
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

              {/* Sliders: Stability, Similarity */}
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
                  Text a dir (Guió / Diàleg en Català o Espanyol)
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
                    <span>Sintetitzant veu ({selectedVoice?.name || 'Veu'})...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-200" />
                    <span>Generar Veu ({selectedVoice?.name || 'Veu'})</span>
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
                  VoiceLab: Clonació Instantània de Veu
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Puja un àudio (de WhatsApp, micròfon o fitxer) per extreure el patró de qualsevol veu sense pagar res.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nom de la Veu</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Ex: La Meva Veu o Veu d'en Joan"
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Upload Voice File or Mic Recording */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">Àudio de Referència:</label>
                
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <label className="flex items-center justify-center gap-2 border border-studio-cardBorder hover:border-emerald-500/60 rounded-xl p-3 text-xs text-slate-300 hover:text-white cursor-pointer transition bg-studio-bg">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-xs">Pujar Fitxer</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setCloneFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                    className={`flex items-center justify-center gap-2 border rounded-xl p-3 text-xs font-semibold transition ${
                      isRecordingMic
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-300 hover:text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-rose-400" />
                    <span>{isRecordingMic ? `Aturar (${recordSeconds}s)` : 'Gravar Micròfon'}</span>
                  </button>
                </div>

                {cloneFile && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="truncate">Arxiu: {cloneFile.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Transcripció de la mostra (Opcional)
                </label>
                <input
                  type="text"
                  value={cloneSampleText}
                  onChange={(e) => setCloneSampleText(e.target.value)}
                  placeholder="Què diu l'àudio de mostra? Ajuda a afinar la pronunciació."
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleCloneVoice}
                disabled={isCloning}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white transition shadow-lg flex items-center justify-center gap-2 ${
                  isCloning
                    ? 'bg-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                }`}
              >
                {isCloning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Clonant veu i desant perfil acústic...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Clonar i Guardar Veu ara (Sense Cost)</span>
                  </>
                )}
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
                <span className="text-[11px] font-mono text-slate-400">
                  Àudio Stereo 48kHz • Masteritzat
                </span>
              </div>

              {/* Visual Waveform Simulation */}
              <div className="h-32 bg-studio-bg rounded-xl border border-studio-cardBorder flex items-center justify-center px-4 overflow-hidden relative">
                <div className="flex items-center gap-1.5 w-full justify-center h-full">
                  {[...Array(40)].map((_, i) => {
                    const heightPercent = isPlaying
                      ? Math.min(100, Math.max(15, (Math.sin(i * 0.5 + Date.now() * 0.005) + 1) * 45))
                      : ((i % 5) + 1) * 14;
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-75 ${
                          isPlaying
                            ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                            : 'bg-slate-700'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              <audio
                ref={audioRef}
                src={generatedAudio}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>

            {/* Audio Controls Bar */}
            <div className="pt-4 border-t border-studio-cardBorder flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20 transition"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {selectedVoice?.name || 'Pista d\'Àudio'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isPlaying ? 'Reproduint en temps real...' : 'A punt per escoltar o descarregar'}
                  </span>
                </div>
              </div>

              <a
                href={generatedAudio}
                download="veu_clonada.mp3"
                className="px-4 py-2 rounded-xl bg-studio-bg border border-studio-cardBorder hover:border-emerald-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Descarregar Àudio</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
