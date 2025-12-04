import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnalysisResult, Recommendation } from '../types';
import { continueChart } from '../services/geminiService';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageBase64: string;
  mimeType: string;
  result: AnalysisResult | null;
}

const getAnnotationColor = (recommendation?: Recommendation) => {
  switch (recommendation) {
    case Recommendation.BUY:
      return '#22c55e'; // tailwind green-500
    case Recommendation.SELL:
      return '#ef4444'; // tailwind red-500
    case Recommendation.HOLD:
      return '#eab308'; // tailwind yellow-500
    default:
      return '#ffffff'; // white
  }
};

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_SENSITIVITY = 0.002;

const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, imageSrc, imageBase64, mimeType, result }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [continuedImageSrc, setContinuedImageSrc] = useState<string | null>(null);
  const [viewingOriginal, setViewingOriginal] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);


  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const viewOriginal = useCallback(() => {
    if (!viewingOriginal) {
        setViewingOriginal(true);
        handleReset();
    }
  }, [viewingOriginal, handleReset]);

  const viewPredicted = useCallback(() => {
      if (viewingOriginal && continuedImageSrc) {
          setViewingOriginal(false);
          handleReset();
      }
  }, [viewingOriginal, continuedImageSrc, handleReset]);


  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        handleReset();
        setContinuedImageSrc(null);
        setViewingOriginal(true);
        setIsGenerating(false);
        setGenerationError(null);
      }, 300);
    }
  }, [isOpen, handleReset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale === 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * (1 + delta)));

    if (newScale === scale) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const imageX = (mouseX - position.x) / scale;
    const imageY = (mouseY - position.y) / scale;
    
    const newX = mouseX - imageX * newScale;
    const newY = mouseY - imageY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  }, [scale, position]);
  
  const handleGenerateContinuation = async () => {
    if (!result || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const newImageBase64 = await continueChart(imageBase64, mimeType, result);
      setContinuedImageSrc(`data:image/png;base64,${newImageBase64}`);
      setViewingOriginal(false);
      handleReset();
    } catch (error) {
      console.error("Failed to generate chart continuation:", error);
      setGenerationError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };


  if (!isOpen || !result) {
    return null;
  }

  const annotationColor = getAnnotationColor(result.recommendation);
  const { annotation } = result;
  const cursorClass = scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default';
  const displayImageSrc = viewingOriginal || !continuedImageSrc ? imageSrc : continuedImageSrc;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center z-50 animate-fade-in p-4 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chart-modal-title"
    >
      {/* Main Image Viewer */}
      <div 
        className="relative flex-grow w-full max-w-7xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={containerRef}
          className={`relative overflow-hidden rounded-md w-full h-full ${cursorClass}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div
            className="transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
            }}
          >
            <img src={displayImageSrc} alt="Market chart analysis" className="max-w-full max-h-full object-contain absolute top-0 left-0" style={{ width: '100%', height: '100%' }} />
            {annotation && viewingOriginal && (
              <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="5" refY="1.75" orient="auto">
                    <polygon points="0 0, 5 1.75, 0 3.5" fill={annotationColor} />
                  </marker>
                </defs>
                <line
                  x1={annotation.start.x}
                  y1={annotation.start.y}
                  x2={annotation.end.x}
                  y2={annotation.end.y}
                  stroke={annotationColor}
                  strokeWidth={0.8 / scale} // Make stroke width responsive to zoom
                  markerEnd="url(#arrowhead)"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div
        className="flex-shrink-0 w-full max-w-6xl bg-slate-900/80 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl p-4 mt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div id="chart-modal-title" className="p-3 bg-slate-800/50 rounded-md border border-slate-700 flex-grow basis-1/3">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">Prediction</h3>
            <p className="text-slate-200 text-sm md:text-base">{result.prediction}</p>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-grow">
             <div 
                className={`relative w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${viewingOriginal ? 'border-cyan-500' : 'border-slate-600 hover:border-slate-500'}`}
                onClick={viewOriginal}
                title="View Original Chart"
             >
                <img src={imageSrc} className="w-full h-full object-cover" alt="Original Chart Preview"/>
                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-center">
                    <span className="text-xs font-semibold text-white">Original</span>
                </div>
            </div>

            {continuedImageSrc ? (
                <div 
                    className={`relative w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${!viewingOriginal ? 'border-cyan-500' : 'border-slate-600 hover:border-slate-500'}`}
                    onClick={viewPredicted}
                    title="View Predicted Chart"
                >
                    <img src={continuedImageSrc} className="w-full h-full object-cover" alt="Predicted Chart Preview"/>
                    <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-center">
                        <span className="text-xs font-semibold text-white">Predicted</span>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleGenerateContinuation}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center text-sm disabled:cursor-not-allowed bg-cyan-500 text-slate-900 hover:bg-cyan-400 transform hover:scale-105 disabled:bg-slate-600 disabled:scale-100 w-36 h-24"
                >
                    {isGenerating ? (
                        <div className="text-center">
                            <svg className="animate-spin mx-auto mb-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating...</span>
                        </div>
                    ) : (
                         <div className="text-center">
                            <WandIcon className="h-6 w-6 mx-auto mb-1" />
                            <span>Generate Continuation</span>
                        </div>
                    )}
                </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
           <button
             onClick={handleReset}
             className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-600"
             aria-label="Reset view"
           >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
             </svg>
           </button>
           <button
             onClick={onClose}
             className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-600"
             aria-label="Close modal"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
          </div>
        </div>
         {generationError && (
          <div className="mt-2 text-center bg-red-900/50 border border-red-500 text-red-300 p-2 rounded-md text-sm">
              <p className="font-semibold">Generation Failed: <span className="font-normal">{generationError}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartModal;
