'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Sparkles, Zap, Sliders, Layers } from 'lucide-react';
import { processImage, DitherMethod } from '../utils/ditherEngine';

const ALGORITHMS: { id: DitherMethod; label: string }[] = [
  { id: 'floyd', label: 'Floyd' },
  { id: 'atkinson', label: 'Atkinson' },
  { id: 'bayer', label: 'Bayer' },
  { id: 'random', label: 'Noise' },
  { id: 'threshold', label: 'Simple' },
];

export default function DitherStudio() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings
  const [method, setMethod] = useState<DitherMethod>('atkinson'); // Default to Atkinson for aesthetics
  const [scale, setScale] = useState(0.5);
  const [contrast, setContrast] = useState(10);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    requestAnimationFrame(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const targetWidth = Math.floor(originalImage.width * scale);
      const targetHeight = Math.floor(originalImage.height * scale);
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const processedData = processImage(imageData, method, contrast);

      ctx.putImageData(processedData, 0, 0);
      setProcessedUrl(canvas.toDataURL('image/png'));
      setIsProcessing(false);
    });
  }, [originalImage, method, scale, contrast]);

  useEffect(() => {
    // Run the dither asynchronously to avoid calling setState synchronously inside the effect
    const rafId = requestAnimationFrame(() => runDither());
    return () => cancelAnimationFrame(rafId);
  }, [runDither]);

  const downloadImage = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.download = `dither-${method}-${Date.now()}.png`;
    link.href = processedUrl;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      <canvas ref={canvasRef} className="hidden" />

      {/* Navbar */}
      <nav className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-slate-900 to-slate-700 rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-900">Dither<span className="text-slate-400">Image</span></h1>
        </div>
        <div className="flex gap-4">
           {/* You could add social links or profile icons here */}
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
        
        {/* 1. The Viewport (Image Area) - Takes up most space */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
          <div className="flex-1 bg-white rounded-[2rem] border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden relative group">
             
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>

             {!originalImage ? (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50/50 transition-colors"
               >
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                   <Upload className="w-8 h-8 text-slate-900" />
                 </div>
                 <h3 className="text-xl font-semibold text-slate-800 mb-2">Drop your image here</h3>
                 <p className="text-slate-400">or click to browse files</p>
               </div>
             ) : (
               <div className="w-full h-full p-8 flex items-center justify-center overflow-auto custom-scrollbar">
                 {processedUrl && <img 
                   src={processedUrl} 
                   alt="Processed"
                   className={`max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-opacity duration-200 ${isProcessing ? 'opacity-80 blur-[1px]' : 'opacity-100'}`}
                   style={{ imageRendering: 'pixelated' }}
                 />}
               </div>
             )}
             
             {/* Top Right Action - Reset */}
             {originalImage && (
               <button 
                onClick={() => setOriginalImage(null)}
                className="absolute top-6 right-6 bg-white/80 backdrop-blur hover:bg-white text-slate-500 hover:text-red-500 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-slate-100 transition-all"
               >
                 Clear Image
               </button>
             )}
          </div>
        </div>

        {/* 2. The Control Panel - Floating Glass Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full">
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-6 h-full flex flex-col justify-between">
            
            {/* Scrollable Controls Area */}
            <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2">
              
              {/* Upload Button (Small) if image exists */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpload} 
                className="hidden" 
                accept="image/*"
              />
              
              {/* Algorithm Selector */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold text-sm uppercase tracking-wide opacity-70">Algorithm</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALGORITHMS.map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => setMethod(algo.id)}
                      className={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border ${
                        method === algo.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-[1.02]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {algo.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-slate-200/60" />

              {/* Sliders */}
              <div className="space-y-6">
                
                {/* Scale Slider */}
                <div className="group">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-500" />
                      <label className="font-semibold text-sm text-slate-700">Resolution</label>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-mono">
                      {Math.floor(scale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="modern-range w-full"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    <span>Retro</span>
                    <span>HD</span>
                  </div>
                </div>

                {/* Contrast Slider */}
                <div className="group">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-500" />
                      <label className="font-semibold text-sm text-slate-700">Contrast</label>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-mono">
                      {contrast > 0 ? `+${contrast}` : contrast}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="modern-range w-full"
                  />
                </div>
              </div>
            </div>

            {/* Download Action */}
            <div className="pt-6 mt-4 border-t border-slate-200/60">
              <button
                onClick={downloadImage}
                disabled={!processedUrl}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span>Export Image</span>
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}