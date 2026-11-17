import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ComparisonSlider({ beforeImage, afterImage, beforeLabel = "Original", afterLabel = "Magnific Enhanced" }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Zoom and Controls Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <Columns className="w-3.5 h-3.5 text-pink-400" />
          Arrossega el divisor per comparar detalls (Before / After)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(1, zoom - 0.25))}
            className="p-1 hover:text-white rounded bg-studio-cardBorder hover:bg-slate-700 transition"
            title="Redueix zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="p-1 hover:text-white rounded bg-studio-cardBorder hover:bg-slate-700 transition"
            title="Augmenta zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1); setSliderPosition(50); }}
            className="p-1 hover:text-white rounded bg-studio-cardBorder hover:bg-slate-700 transition ml-1"
            title="Reiniciar vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comparison Container */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        className="relative w-full aspect-video md:aspect-[16/10] bg-black/60 rounded-xl overflow-hidden border border-studio-cardBorder select-none cursor-ew-resize group"
      >
        {/* AFTER IMAGE (Enhanced - Background) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
          <img
            src={afterImage}
            alt={afterLabel}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
          />
          <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur border border-pink-500/40 text-[11px] font-semibold text-pink-300 pointer-events-none shadow-md">
            {afterLabel}
          </div>
        </div>

        {/* BEFORE IMAGE (Original - Clipped) */}
        <div
          className="absolute inset-0 h-full overflow-hidden flex items-center justify-center pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <div
            className="relative h-full flex items-center justify-center"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          >
            <img
              src={beforeImage}
              alt={beforeLabel}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
            />
          </div>
          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur border border-slate-700 text-[11px] font-semibold text-slate-300 pointer-events-none shadow-md">
            {beforeLabel}
          </div>
        </div>

        {/* SLIDER LINE & HANDLE */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-studio-bg border-2 border-white shadow-xl flex items-center justify-center text-white">
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-slate-300 rounded-full" />
              <span className="w-0.5 h-3 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
