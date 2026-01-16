'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Download, Sparkles, RefreshCw, Layers, Sliders, Zap } from 'lucide-react';
import { processImage, DitherMethod } from '../utils/ditherEngine';

const ALGORITHMS: { id: DitherMethod; label: string }[] = [
  { id: 'floyd', label: 'Floyd' },
  { id: 'atkinson', label: 'Atkinson' },
  { id: 'bayer', label: 'Bayer' },
  { id: 'random', label: 'Noise' },
  { id: 'threshold', label: 'Simple' },
  { id: 'none', label: 'Original' },
];

export default function DitherStudio() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings
  const [method, setMethod] = useState<DitherMethod>('atkinson');
  const [scale, setScale] = useState(0.5);
  const [contrast, setContrast] = useState(10);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced scale for performance
  const [debouncedScale, setDebouncedScale] = useState(0.5);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedScale(scale);
    }, 150); // 150ms debounce for smooth slider interaction

    return () => clearTimeout(timer);
  }, [scale]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setOriginalImage(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const runDither = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    setIsProcessing(true);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      requestAnimationFrame(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const targetWidth = Math.floor(originalImage.width * debouncedScale);
        const targetHeight = Math.floor(originalImage.height * debouncedScale);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const processedData = processImage(imageData, method, contrast);

        ctx.putImageData(processedData, 0, 0);
        setProcessedUrl(canvas.toDataURL('image/png'));
        setIsProcessing(false);
      });
    }, 0);
  }, [originalImage, method, debouncedScale, contrast]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => runDither());
    return () => cancelAnimationFrame(rafId);
  }, [originalImage, method, debouncedScale, contrast]);

  const downloadImage = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.download = `dither-${method}-${Date.now()}.png`;
    link.href = processedUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 overflow-hidden font-sans">
      <canvas ref={canvasRef} className="hidden" />
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />

      {/* Floating Header */}
      <header className="fixed top-6 inset-x-6 z-20 flex items-center justify-between pointer-events-none animate-in">
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-full shadow-sm pointer-events-auto">
          <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-3 h-3" />
          </div>
          <span className="font-bold text-sm tracking-tight">DitherStudio</span>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          {originalImage && (
            <>
              <button
                onClick={() => setOriginalImage(null)}
                className="glass p-2.5 rounded-full hover:bg-white text-slate-500 hover:text-red-500 transition-all shadow-sm"
                title="Clear Image"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={downloadImage}
                className="bg-slate-900 text-white p-2.5 rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Center Stage Viewport */}
      <main className="relative w-full h-full flex items-center justify-center p-4 lg:p-12 pb-32">
        {!originalImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-full max-w-xl aspect-[4/3] glass rounded-[3rem] border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-500">
              <Upload className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Click to upload</h3>
            <p className="text-sm text-slate-400">or drag and drop your image</p>
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[calc(100vh-240px)] flex items-center justify-center animate-in">
            {processedUrl && (
              <img
                src={processedUrl}
                alt="Dithered result"
                className={`max-w-full max-h-full object-contain shadow-2xl transition-all duration-300 ${isProcessing ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                style={{ imageRendering: 'pixelated' }}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Controls Tray */}
      {originalImage && (
        <div className="fixed bottom-8 inset-x-6 z-20 flex justify-center pointer-events-none animate-in">
          <div className="glass shadow-2xl rounded-[2.5rem] p-3 flex flex-col md:flex-row items-center gap-4 pointer-events-auto overflow-hidden max-w-full">

            {/* Algorithm Pills */}
            <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-full overflow-x-auto hide-scrollbar max-w-[calc(100vw-4rem)]">
              {ALGORITHMS.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => setMethod(algo.id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap ${method === algo.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {algo.label}
                </button>
              ))}
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200/50" />

            {/* Range Controls */}
            <div className="flex items-center gap-6 px-4 py-2">
              <div className="flex items-center gap-3 min-w-[140px]">
                <Layers className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="modern-range w-24"
                />
                <span className="text-[10px] font-mono text-slate-500 w-8">{Math.floor(scale * 100)}%</span>
              </div>

              <div className="flex items-center gap-3 min-w-[140px]">
                <Sliders className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="-50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="modern-range w-24"
                />
                <span className="text-[10px] font-mono text-slate-500 w-8">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}