import React, { useState, useRef } from 'react';
import { User, Mic, Upload, Play, Pause, Film, Sparkles, CheckCircle2, Download, Video, Music, RefreshCw, Smartphone, Subtitles } from 'lucide-react';

export default function AvatarStudio({ hardwareInfo }) {
  // Avatar Image
  const [avatarImage, setAvatarImage] = useState(
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
  );
  const [avatarImageFile, setAvatarImageFile] = useState(null);

  // Audio / Voice source
  const [audioMode, setAudioMode] = useState('upload'); // 'upload' (la teva veu pròpia), 'record' (gravar), 'clone' (clonació)
  const [uploadedAudioFile, setUploadedAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Expression controls (LivePortrait style)
  const [headMotion, setHeadMotion] = useState(5);
  const [eyeBlink, setEyeBlink] = useState(7);
  const [mouthExpression, setMouthExpression] = useState('natural');
  const [addSubtitles, setAddSubtitles] = useState(true);

  // Processing & Result
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle uploading the user's custom voice audio
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarImageFile(file);
      setAvatarImage(URL.createObjectURL(file));
    }
  };

  // Microphone recording
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
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setUploadedAudioFile(new File([audioBlob], 'veu_gravada.mp3'));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      const interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert('No s\'ha pogut accedir al micròfon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Generate HeyGen-style Talking Avatar
  const handleGenerateAvatarVideo = async () => {
    setIsGenerating(true);
    setProgress(15);
    setStatusMessage('Carregant imatge i àudio al servidor...');

    try {
      const formData = new FormData();

      // Send image
      if (avatarImageFile) {
        formData.append('image', avatarImageFile);
      } else {
        const imgRes = await fetch(avatarImage);
        const imgBlob = await imgRes.blob();
        formData.append('image', imgBlob, 'avatar.png');
      }

      // Send audio
      if (uploadedAudioFile) {
        formData.append('audio', uploadedAudioFile);
      }

      formData.append('head_motion', headMotion);
      formData.append('eye_blink', eyeBlink);
      formData.append('add_subtitles', addSubtitles);
      formData.append('subtitle_text', "SABIES D'ON VE AQUESTA FRASE?");

      setProgress(45);
      setStatusMessage('Generant sincronització labial i animació de rostre (LivePortrait)...');

      const response = await fetch('http://localhost:8000/api/avatar/render', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setStatusMessage('Vídeo de l\'avatar renderitzat amb èxit!');
        setGeneratedVideo(data.video_url);
      } else {
        setStatusMessage('Error renderitzant el vídeo al servidor.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error connectant amb el servidor.');
    } finally {
      setIsGenerating(false);
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
              Avatar Studio <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">HeyGen / LivePortrait Gratuït</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crea el teu personatge per a TikTok i YouTube (@agustinmedina1311 style): Carrega la teva veu peculiar i fes que qualsevol foto parli amb sincronització labial exacta a cost zero.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            Format Vertical 9:16 (TikTok & Shorts Monetitzats)
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Custom Voice Setup */}
        <div className="lg:col-span-6 flex flex-col gap-5 bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl">
          {/* STEP 1: L'Avatar (Imatge del Personatge) */}
          <div className="border-b border-studio-cardBorder pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                Pas 1: Imatge del Personatge / Avatar
              </span>
              <label className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-semibold">
                Canviar foto
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={avatarImage}
                alt="Avatar"
                className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md"
              />
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-200 block">Foto de referència per a LivePortrait</span>
                <span>Pots fer servir una foto d'un avi, un rostre generat per IA o qualsevol personatge.</span>
              </div>
            </div>
          </div>

          {/* STEP 2: La teva Veu Peculiar */}
          <div className="border-b border-studio-cardBorder pb-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mic className="w-4 h-4 text-cyan-400" />
              Pas 2: La teva Veu amb Entonació Peculiar
            </span>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setAudioMode('upload')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  audioMode === 'upload'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md'
                    : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pujar Fitxer d'Àudio</span>
              </button>

              <button
                onClick={() => setAudioMode('record')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  audioMode === 'record'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md'
                    : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Gravar amb Micròfon</span>
              </button>
            </div>

            {audioMode === 'upload' && (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-studio-cardBorder hover:border-cyan-500/60 rounded-xl p-4 text-xs text-slate-400 hover:text-white cursor-pointer transition bg-studio-bg/50">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">
                  {uploadedAudioFile ? uploadedAudioFile.name : 'Puja l\'àudio del guió (MP3, WAV, M4A)'}
                </span>
                <span className="text-[10px] text-slate-500">
                  L'avatar mourà els llavis respectant exactament la teva entonació, pauses i ritme.
                </span>
                <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
              </label>
            )}

            {audioMode === 'record' && (
              <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-studio-bg border border-studio-cardBorder">
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <span>Començar a Gravar</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-2 transition"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>Aturar Gravació ({recordingTime}s)</span>
                    </button>
                  )}
                </div>
                {audioUrl && (
                  <audio src={audioUrl} controls className="w-full mt-2 h-9" />
                )}
              </div>
            )}
          </div>

          {/* STEP 3: Ajustos de Moviment LivePortrait */}
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
              Pas 3: Naturalitat Facial (LivePortrait Settings)
            </span>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Moviment de cap i coll</span>
                  <span className="font-mono text-cyan-400 font-bold">{headMotion} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={headMotion}
                  onChange={(e) => setHeadMotion(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Freqüència de parpelleig</span>
                  <span className="font-mono text-cyan-400 font-bold">{eyeBlink} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={eyeBlink}
                  onChange={(e) => setEyeBlink(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Subtitles Toggle */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-studio-bg border border-studio-cardBorder cursor-pointer">
                <input
                  type="checkbox"
                  checked={addSubtitles}
                  onChange={(e) => setAddSubtitles(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded"
                />
                <Subtitles className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-medium">
                  Generar subtítols dinàmics automàtics (estil TikTok / CapCut)
                </span>
              </label>
            </div>
          </div>

          {/* Action Generate Video */}
          <button
            onClick={handleGenerateAvatarVideo}
            disabled={isGenerating}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xl ${
              isGenerating
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white shadow-cyan-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>{statusMessage} ({progress}%)</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-cyan-200" />
                <span>Renderitzar Vídeo de l'Avatar amb LivePortrait</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: 9:16 TikTok / YouTube Shorts Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-[320px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-studio-cardBorder shadow-2xl relative flex flex-col justify-between group">
            {generatedVideo ? (
              <video
                src={generatedVideo}
                autoPlay
                loop
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <img
                  src={avatarImage}
                  alt="Avatar Preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/30 backdrop-blur border border-cyan-400/50 flex items-center justify-center text-white mb-3 shadow-xl">
                    <Play className="w-6 h-6 ml-0.5 text-cyan-200" />
                  </div>
                  <span className="text-sm font-bold text-white">Previsualització 9:16</span>
                  <span className="text-xs text-slate-300 mt-2">
                    Puja el teu àudio i fes clic a renderitzar per veure el personatge parlant en vídeo.
                  </span>
                </div>
              </div>
            )}

            {/* TikTok Style Overlay Badges */}
            <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-700 text-[10px] font-bold text-cyan-300">
              @el_teu_personatge
            </div>

            {addSubtitles && (
              <div className="absolute bottom-12 left-4 right-4 text-center pointer-events-none">
                <span className="inline-block px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur border border-yellow-500/40 text-yellow-300 font-extrabold text-sm uppercase tracking-wide shadow-lg">
                  "SABIES D'ON VE AQUESTA FRASE?"
                </span>
              </div>
            )}
          </div>

          {generatedVideo && (
            <a
              href={generatedVideo}
              download="tiktok_avatar.mp4"
              className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition shadow-lg shadow-cyan-500/25"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Vídeo 9:16 per a TikTok / YouTube</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
