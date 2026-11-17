import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MagnificStudio from './components/MagnificStudio';
import HiggsfieldStudio from './components/HiggsfieldStudio';
import ElevenLabsStudio from './components/ElevenLabsStudio';
import WorkflowStudio from './components/WorkflowStudio';
import HardwareSettings from './components/HardwareSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState('magnific');
  const [magnificOutputImage, setMagnificOutputImage] = useState(null);
  const [higgsfieldOutputVideo, setHiggsfieldOutputVideo] = useState(null);
  const [hardwareInfo, setHardwareInfo] = useState({
    gpu_name: 'NVIDIA GeForce RTX 3050 Laptop GPU',
    vram_gb: 4,
    ram_gb: 16,
    profile: 'LITE'
  });

  // Fetch detected hardware on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/hardware')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gpu_name) {
          setHardwareInfo(data);
        }
      })
      .catch(() => {
        // Fallback default detected on this PC
      });
  }, []);

  const handleSendToHiggsfield = (imageUrl) => {
    setMagnificOutputImage(imageUrl);
    setActiveTab('higgsfield');
  };

  const handleSendToElevenLabs = (videoUrl) => {
    setHiggsfieldOutputVideo(videoUrl);
    setActiveTab('elevenlabs');
  };

  return (
    <div className="min-h-screen bg-studio-bg text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hardwareInfo={hardwareInfo}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'magnific' && (
          <MagnificStudio
            onSendToHiggsfield={handleSendToHiggsfield}
            hardwareInfo={hardwareInfo}
          />
        )}
        {activeTab === 'higgsfield' && (
          <HiggsfieldStudio
            inputImage={magnificOutputImage}
            onSendToElevenLabs={handleSendToElevenLabs}
            hardwareInfo={hardwareInfo}
          />
        )}
        {activeTab === 'elevenlabs' && (
          <ElevenLabsStudio
            inputVideo={higgsfieldOutputVideo}
            hardwareInfo={hardwareInfo}
          />
        )}
        {activeTab === 'workflow' && (
          <WorkflowStudio
            hardwareInfo={hardwareInfo}
          />
        )}
        {activeTab === 'hardware' && (
          <HardwareSettings
            hardwareInfo={hardwareInfo}
            setHardwareInfo={setHardwareInfo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-studio-cardBorder py-4 px-6 text-center text-xs text-slate-500">
        <span>OmniStudio • The Magnific + Higgsfield + ElevenLabs Local Suite • Ready for Multi-PC deployment</span>
      </footer>
    </div>
  );
}
