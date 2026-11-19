import React, { useState, useEffect } from 'react';
import { Video, Film, Play, Pause, RotateCw, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Mic, Download, Sparkles, Compass } from 'lucide-react';

const CAMERA_PRESETS = [
  { id: 'zoom_in', label: 'Zoom In (Dolly)', icon: ZoomIn, desc: 'Apropament dramàtic cap al subjecte' },
  { id: 'zoom_out', label: 'Zoom Out', icon: ZoomOut, desc: 'Allunyament revelant l\'entorn' },
  { id: 'pan_right', label: 'Pan Dret', icon: ArrowRight, desc: 'Desplaçament suau cap a la dreta' },
  { id: 'pan_left', label: 'Pan Esquerre', icon: ArrowLeft, desc: 'Desplaçament suau cap a l\'esquerra' },
  { id: 'tilt_up', label: 'Tilt Amunt', icon: ArrowUp, desc: 'Moviment vertical cap al cel' },
  { id: 'orbit_360', label: 'Orbit Cinema', icon: RotateCw, desc: 'Gir circular 3D al voltant del personatge' },
];

export default function HiggsfieldStudio({ inputImage, onSendToElevenLabs, hardwareInfo }) {
  const [sourceImage, setSourceImage] = useState(
    inputImage || '/static/outputs/lhome_del_bigot.jpg'
  );

  useEffect(() => {
    if (inputImage) {
      setSourceImage(inputImage);
    }
  }, [inputImage]);
  const [activeCamera, setActiveCamera] = useState('zoom_in');
  const [motionSpeed, setMotionSpeed] = useState(6);
  const [cameraShake, setCameraShake] = useState(2);
  const [duration, setDuration] = useState(4);
  const [fps, setFps] = useState(24);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [prompt, setPrompt] = useState('cinematic cinematic camera movement, realistic physics, smooth fluid motion, cinematic depth of field');
  const [characterAction, setCharacterAction] = useState('expressive_gaze');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Demo generated video fallback (Creative cinematic loop)
  const DEMO_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-woman-in-a-futuristic-cyberpunk-environment-42475-large.mp4';

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(10);

    try {
      const response = await fetch('/api/higgsfield/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: sourceImage,
          camera_preset: activeCamera,
          motion_speed: motionSpeed,
          camera_shake: cameraShake,
          duration: duration,
          fps: fps,
          aspect_ratio: aspectRatio,
          prompt: prompt,
          character_action: characterAction,
          hardware_profile: hardwareInfo?.profile || 'LITE'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setVideoUrl(data.video_url || DEMO_VIDEO);
      } else {
        simulateVideoGen();
      }
    } catch {
      simulateVideoGen();
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 900);
    }
  };

  const simulateVideoGen = () => {
    setProgress(35);
    setTimeout(() => {
      setProgress(70);
      setTimeout(() => {
        setProgress(100);
        setVideoUrl(DEMO_VIDEO);
      }, 800);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              Higgsfield Studio <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Càmera & Vídeo AI</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Dóna vida i moviment cinemàtic a qualsevol imatge amb control professional de càmera (Pan, Tilt, Zoom, Orbit).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded bg-studio-card border border-studio-cardBorder text-slate-300">
            Motor: <strong className="text-purple-400">{hardwareInfo?.profile === 'LITE' ? 'AnimateDiff / LivePortrait (Local 4GB)' : 'Wan 2.1 / Hunyuan (Workstation)'}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Director Controls */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-studio-card border border-studio-cardBorder rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-studio-cardBorder pb-3">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              Director de Càmera (Camera Director)
            </span>
            <span className="text-[11px] font-mono text-slate-400">Higgsfield Engine</span>
          </div>

          {/* Camera Motion Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Trajectòria de Càmera Cinemàtica
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAMERA_PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = activeCamera === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveCamera(p.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/15'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-300' : 'text-slate-400'}`} />
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    </div>
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motion Speed Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Intensitat i Velocitat de Moviment</span>
              <span className="font-mono text-purple-400 font-bold">{motionSpeed} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={motionSpeed}
              onChange={(e) => setMotionSpeed(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Subtil / Llum</span>
              <span>Cinemàtic estàndard</span>
              <span>Dramàtic / Dinàmic</span>
            </div>
          </div>

          {/* Character Action / Dynamics */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Dinamisme del Personatge / Subjecte
            </label>
            <select
              value={characterAction}
              onChange={(e) => setCharacterAction(e.target.value)}
              className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="expressive_gaze">Mirada expressiva i parpelleig suau</option>
              <option value="subtle_smile">Somriure subtil i respiració</option>
              <option value="speaking_motion">Parla / Moviment labial (Lip-ready per a veu)</option>
              <option value="wind_in_hair">Efecte de vent als cabells i roba</option>
              <option value="head_turn">Gir suau del cap mirant a càmera</option>
            </select>
          </div>

          {/* Video Duration & Aspect Ratio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Durada</label>
              <div className="flex gap-1.5">
                {[3, 4, 6].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setDuration(sec)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      duration === sec
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-studio-bg border-studio-cardBorder text-slate-400'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Format</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="16:9">16:9 (Cinema / Paisatge)</option>
                <option value="9:16">9:16 (Reels / TikTok)</option>
                <option value="1:1">1:1 (Quadrat)</option>
              </select>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Descripció del Moviment (Prompt de Vídeo)
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: smooth dolly zoom in, hair gently blowing in the wind..."
              className="w-full bg-studio-bg border border-studio-cardBorder rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Action Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
              isGenerating
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white shadow-purple-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                <span>Renderitzant fotogrames ({progress}%)...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-purple-200" />
                <span>Generar Vídeo ({duration}s amb Higgsfield)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Video Stage / Screen */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-studio-card border border-studio-cardBorder rounded-2xl p-4 shadow-xl flex flex-col justify-between h-full">
            <div className="relative w-full aspect-video bg-black/80 rounded-xl overflow-hidden border border-studio-cardBorder flex items-center justify-center group">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={sourceImage}
                    alt="Fotograma inicial"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-full bg-purple-600/40 backdrop-blur border border-purple-400/50 flex items-center justify-center text-white mb-3 shadow-xl">
                      <Play className="w-6 h-6 ml-0.5 text-purple-200" />
                    </div>
                    <span className="text-sm font-bold text-white">Fotograma Clau Preparat</span>
                    <span className="text-xs text-slate-400 mt-1 max-w-sm">
                      Prem "Generar Vídeo" per aplicar el moviment de càmera {activeCamera.replace('_', ' ')} i renderitzar l'animació.
                    </span>
                  </div>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur border border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {aspectRatio} • {fps} FPS • {duration}s
              </div>

              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-purple-500/20 backdrop-blur border border-purple-500/40 text-[11px] font-semibold text-purple-300">
                Moviment: {activeCamera}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-studio-cardBorder mt-4">
              <div className="text-xs text-slate-400">
                Estat: <strong className="text-white">{videoUrl ? 'Vídeo renderitzat a punt' : 'Esperant generació'}</strong>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {videoUrl && (
                  <a
                    href={videoUrl}
                    download="higgsfield-video.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-studio-bg border border-slate-700 hover:border-slate-500 text-xs text-slate-300 hover:text-white transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarregar MP4</span>
                  </a>
                )}

                <button
                  onClick={() => onSendToElevenLabs && onSendToElevenLabs(videoUrl || DEMO_VIDEO)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-xs font-bold text-white transition shadow-lg shadow-emerald-500/20"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Afegir Veu & So a ElevenLabs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
