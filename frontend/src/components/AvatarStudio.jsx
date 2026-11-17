import React, { useState, useEffect, useRef } from 'react';
import { User, Mic, Upload, Play, Pause, Film, Sparkles, CheckCircle2, Download, Video, Music, RefreshCw, Smartphone, Subtitles, Plus, FileText, Settings, Volume2 } from 'lucide-react';

export default function AvatarStudio({ hardwareInfo }) {
  // Characters State
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Character Form
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharVoice, setNewCharVoice] = useState('ca_enric');
  const [newCharImageFile, setNewCharImageFile] = useState(null);
  const [newCharImagePreview, setNewCharImagePreview] = useState(null);

  // Generation Mode: 'audio' (Opció A: Audio directe) or 'script' (Opció B: Guió de text)
  const [generationMode, setGenerationMode] = useState('audio');

  // Option A: Audio Input
  const [audioInputType, setAudioInputType] = useState('upload'); // 'upload' or 'record'
  const [uploadedAudioFile, setUploadedAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Option B: Script Text Input
  const [scriptText, setScriptText] = useState("Sabies d'on ve l'expressió 'anar amb una sabata i un espardenya'? Avui t'ho explico en menys d'un minut!");

  // Video Settings
  const [headMotion, setHeadMotion] = useState(6);
  const [eyeBlink, setEyeBlink] = useState(7);
  const [addSubtitles, setAddSubtitles] = useState(true);
  const [subtitleText, setSubtitleText] = useState("SABIES D'ON VE AQUESTA FRASE?");

  // Processing & Output Video
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch saved characters on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/characters')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setCharacters(data);
          setSelectedCharacter(data[0]);
        }
      })
      .catch(() => {
        // Fallback default
        const defaultChar = {
          id: 'char_agustin',
          name: 'Agustín (Divulgador de Frases)',
          description: "Avi savi i carismàtic que explica l'origen de dites i refranys populars amb to proper i humor.",
          avatar_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
          voice_name: 'Enric (Català)',
          voice_id: 'ca_enric'
        };
        setCharacters([defaultChar]);
        setSelectedCharacter(defaultChar);
      });
  }, []);

  // Handle Create Character
  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!newCharName) return;

    const formData = new FormData();
    formData.append('name', newCharName);
    formData.append('description', newCharDesc);
    formData.append('voice_id', newCharVoice);
    formData.append('voice_name', newCharVoice === 'ca_enric' ? 'Enric (Català)' : 'Joana (Català)');
    if (newCharImageFile) {
      formData.append('image', newCharImageFile);
    }

    try {
      const res = await fetch('http://localhost:8000/api/characters', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setCharacters([...characters, data.character]);
        setSelectedCharacter(data.character);
        setShowCreateModal(false);
        setNewCharName('');
        setNewCharDesc('');
        setNewCharImageFile(null);
        setNewCharImagePreview(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Audio Upload handler
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedAudioFile(file);
      setAudioPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioPreviewUrl(URL.createObjectURL(audioBlob));
        setUploadedAudioFile(new File([audioBlob], 'veu_peculiar_gravada.mp3'));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      const interval = setInterval(() => {
        setRecordingSeconds((prev) => {
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Render Talking Avatar Video (The MVP generator)
  const handleRenderVideo = async () => {
    if (!selectedCharacter) {
      alert('Si us plau, selecciona o crea un personatge primer.');
      return;
    }

    setIsRendering(true);
    setRenderProgress(15);
    setRenderStatus('Preparant fotogrames de referència...');

    try {
      const formData = new FormData();
      formData.append('image_url', selectedCharacter.avatar_image);
      formData.append('head_motion', headMotion);
      formData.append('eye_blink', eyeBlink);
      formData.append('add_subtitles', addSubtitles);
      formData.append('subtitle_text', subtitleText);

      if (generationMode === 'audio') {
        if (!uploadedAudioFile) {
          alert('Si us plau, puja un fitxer d\'àudio o grava amb el micròfon per a l\'Opció A.');
          setIsRendering(false);
          return;
        }
        formData.append('audio', uploadedAudioFile);
        setRenderProgress(35);
        setRenderStatus('Analitzant fonemes i amplitud del teu àudio sense editar-lo...');
      } else {
        // Script Mode (Option B)
        formData.append('script_text', scriptText);
        formData.append('voice_id', selectedCharacter.voice_id || 'ca_enric');
        setRenderProgress(35);
        setRenderStatus(`Sintetitzant veu guardada de ${selectedCharacter.name}...`);
      }

      setRenderProgress(60);
      setRenderStatus('Generant moviment de boca (Lip-Sync real) i parpelleig...');

      const response = await fetch('http://localhost:8000/api/avatar/render', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setRenderProgress(100);
        setRenderStatus('Vídeo de l\'avatar completat amb èxit!');
        setOutputVideoUrl(data.video_url);
      } else {
        setRenderStatus('Error durant el renderitzat.');
      }
    } catch (err) {
      console.error(err);
      setRenderStatus('Error de connexió.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              Avatar Studio <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">MVP HeyGen Free</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crea el teu personatge (@agustinmedina1311 style) i genera vídeos amb moviment de boca (Lip-Sync) passant-li un àudio directe o un guió.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear Nou Personatge</span>
        </button>
      </div>

      {/* Main Grid: Selection + Generator + TikTok Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Characters Carousel & Execution Mode */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* FASE 1: Selecció de Personatge Base */}
          <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-studio-cardBorder pb-3 mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Fase 1: Personatge Actiu ({characters.length} creats)
              </span>
              <span className="text-[11px] text-slate-400">Tria amb qui vols generar el vídeo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map((char) => {
                const isSelected = selectedCharacter?.id === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                      isSelected
                        ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md shadow-cyan-500/15'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={char.avatar_image}
                      alt={char.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{char.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-cyan-300 block font-mono">Veu: {char.voice_name || 'Personalitzada'}</span>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{char.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FASE 2: Circuit de Generació del Vídeo (Opció A vs Opció B) */}
          <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="border-b border-studio-cardBorder pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                Fase 2: Com vols generar el vídeo de l'avatar?
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGenerationMode('audio')}
                className={`py-3 px-4 rounded-xl border text-left flex flex-col gap-1 transition ${
                  generationMode === 'audio'
                    ? 'bg-gradient-to-r from-cyan-600/30 to-teal-600/20 border-cyan-500 text-white shadow-lg'
                    : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-300">
                    <Mic className="w-4 h-4" />
                    Opció A: Passar-li un Àudio
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    Sense tocar l'àudio
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Puges o graves la teva veu peculiar. L'avatar mou la boca adaptant-se al teu ritme original.
                </span>
              </button>

              <button
                onClick={() => setGenerationMode('script')}
                className={`py-3 px-4 rounded-xl border text-left flex flex-col gap-1 transition ${
                  generationMode === 'script'
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 border-purple-500 text-white shadow-lg'
                    : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-purple-300">
                    <FileText className="w-4 h-4" />
                    Opció B: Passar-li un Guió
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    Veu del personatge
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Escrius el text del vídeo. L'avatar parla fent servir la veu guardada a la seva fitxa.
                </span>
              </button>
            </div>

            {/* Content for Option A: Audio */}
            {generationMode === 'audio' && (
              <div className="p-4 rounded-xl bg-studio-bg/60 border border-studio-cardBorder flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Entrada d'Àudio amb Veu Peculiar:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setAudioInputType('upload')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        audioInputType === 'upload' ? 'bg-cyan-600 text-white' : 'text-slate-400 bg-studio-card'
                      }`}
                    >
                      Pujar Fitxer
                    </button>
                    <button
                      onClick={() => setAudioInputType('record')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        audioInputType === 'record' ? 'bg-cyan-600 text-white' : 'text-slate-400 bg-studio-card'
                      }`}
                    >
                      Gravar Micròfon
                    </button>
                  </div>
                </div>

                {audioInputType === 'upload' ? (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-studio-cardBorder hover:border-cyan-500/60 rounded-xl p-5 text-xs text-slate-400 hover:text-white cursor-pointer transition bg-studio-bg/50">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">
                      {uploadedAudioFile ? uploadedAudioFile.name : "Selecciona el fitxer d'àudio gravat (MP3, WAV)"}
                    </span>
                    <span className="text-[10px] text-slate-500">Aquest àudio NO s'editarà: el personatge l'interpretarà tal com és.</span>
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-studio-card border border-studio-cardBorder gap-2">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        <span>Començar a Gravar amb el Micròfon</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-2 transition"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span>Aturar Gravació ({recordingSeconds}s)</span>
                      </button>
                    )}
                    {audioPreviewUrl && <audio src={audioPreviewUrl} controls className="w-full mt-2 h-8" />}
                  </div>
                )}
              </div>
            )}

            {/* Content for Option B: Script Text */}
            {generationMode === 'script' && (
              <div className="p-4 rounded-xl bg-studio-bg/60 border border-studio-cardBorder flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Guió a interpretar:</span>
                  <span className="text-[10px] font-mono text-purple-300">
                    Veu: {selectedCharacter?.voice_name || 'Enric (Català)'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Escriu el text del guió per al personatge..."
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            )}

            {/* Extra Controls: Subtitles & LivePortrait Motion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={addSubtitles}
                  onChange={(e) => setAddSubtitles(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded"
                />
                <Subtitles className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-medium">Subtítols estil TikTok (@agustinmedina1311)</span>
              </label>

              <div className="p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder flex items-center justify-between text-xs">
                <span className="text-slate-400">Moviment facial:</span>
                <span className="font-bold text-cyan-300">Lip-Sync Dinàmic</span>
              </div>
            </div>

            {/* Big Action Render Button */}
            <button
              onClick={handleRenderVideo}
              disabled={isRendering}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xl ${
                isRendering
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white shadow-cyan-500/25'
              }`}
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>{renderStatus} ({renderProgress}%)</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-cyan-200" />
                  <span>Renderitzar Vídeo de l'Avatar amb Moviment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: 9:16 Video Player & Download */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[320px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-studio-cardBorder shadow-2xl relative flex flex-col justify-between">
            {outputVideoUrl ? (
              <video
                key={outputVideoUrl}
                src={outputVideoUrl}
                autoPlay
                loop
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                {selectedCharacter ? (
                  <img
                    src={selectedCharacter.avatar_image}
                    alt={selectedCharacter.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/30 backdrop-blur border border-cyan-400/50 flex items-center justify-center text-white mb-3 shadow-xl">
                    <Play className="w-6 h-6 ml-0.5 text-cyan-200" />
                  </div>
                  <span className="text-sm font-bold text-white">Previsualització 9:16</span>
                  <span className="text-xs text-slate-300 mt-2">
                    {selectedCharacter ? `Preparat per generar amb ${selectedCharacter.name}` : 'Selecciona un personatge'}
                  </span>
                </div>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-700 text-[10px] font-bold text-cyan-300">
              @{selectedCharacter?.name ? selectedCharacter.name.toLowerCase().replace(/\s+/g, '') : 'avatar'}
            </div>
          </div>

          {outputVideoUrl && (
            <a
              href={outputVideoUrl}
              download={outputVideoUrl.split('/').pop()}
              className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition shadow-lg shadow-cyan-500/25"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Vídeo MP4 per a TikTok / YouTube</span>
            </a>
          )}
        </div>
      </div>

      {/* MODAL: Crear Nou Personatge */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-studio-cardBorder pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Crear Nou Personatge / Avatar
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCharacter} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nom del Personatge</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Agustín, L'Avi Historiador, Professor Carles..."
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Personalitat i Estil</label>
                <textarea
                  rows={2}
                  placeholder="Descriu la seva manera de parlar, to i temes dels vídeos..."
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Veu de Referència per Defecte</label>
                <select
                  value={newCharVoice}
                  onChange={(e) => setNewCharVoice(e.target.value)}
                  className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ca_enric">Enric (Català - Home Madur / Savi)</option>
                  <option value="ca_joana">Joana (Català - Dona Expressiva)</option>
                  <option value="es_alvaro">Álvaro (Espanyol - Proper i Col·loquial)</option>
                  <option value="es_elvira">Elvira (Espanyol - Professional)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Foto del Personatge (Rostre)</label>
                <label className="flex items-center justify-center gap-2 border border-dashed border-studio-cardBorder hover:border-cyan-500/60 rounded-xl p-3 text-slate-400 hover:text-white cursor-pointer transition bg-studio-bg/50">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>{newCharImageFile ? newCharImageFile.name : 'Pujar Imatge (JPG, PNG)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setNewCharImageFile(e.target.files[0]);
                        setNewCharImagePreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {newCharImagePreview && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-studio-bg border border-slate-700">
                  <img src={newCharImagePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-slate-300">Imatge carregada correctament</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-studio-cardBorder">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-studio-bg border border-studio-cardBorder text-slate-400 hover:text-white"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg shadow-cyan-600/20"
                >
                  Guardar Personatge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
