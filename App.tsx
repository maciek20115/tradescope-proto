import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AnalysisDisplay from './components/AnalysisDisplay';
import Loader from './components/Loader';
import ChartModal from './components/ChartModal';
import { analyzeChart } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // remove the "data:image/jpeg;base64," part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleImageUpload = useCallback(async (file: File) => {
    handleReset();
    setImageFile(file);
    try {
      const base64String = await fileToBase64(file);
      setImageBase64(base64String);
    } catch (err) {
      setError('Could not process the image file.');
      console.error(err);
    }
  }, []);
  
  const handleAnalyzeClick = useCallback(async () => {
    if (!imageBase64 || !imageFile) {
      setError('Please upload an image first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      const result = await analyzeChart(imageBase64, imageFile.type);
      setAnalysis(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageBase64, imageFile]);
  
  const handleReset = () => {
    setImageFile(null);
    setImageBase64(null);
    setAnalysis(null);
    setIsLoading(false);
    setError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-grid-slate-700/[0.2] font-sans flex flex-col p-4 md:p-6 gap-4 md:gap-6">
      {/* Top Panel: Preview */}
      <div className="flex-grow flex flex-col border-2 border-slate-800 rounded-2xl p-4 md:p-6 relative bg-slate-900/50 backdrop-blur-sm shadow-2xl shadow-black/30">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center mt-4">
          {!imageFile && <ImageUploader onImageUpload={handleImageUpload} />}
          {imageFile && (
            <div className="flex flex-col items-center text-center w-full h-full">
              <div 
                className={`relative flex-grow w-full mb-6 border-4 border-slate-700 rounded-lg shadow-lg shadow-black/50 overflow-hidden 
                ${analysis ? 'cursor-pointer hover:border-cyan-500 transition-colors' : ''}`}
                onClick={() => analysis && setIsModalOpen(true)}
                aria-label={analysis ? 'Expand chart' : 'Chart preview'}
              >
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Market chart preview" 
                  className="w-full h-full object-contain"
                />
                 {analysis && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white font-bold text-lg flex items-center p-4 bg-slate-800/50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                      </svg>
                      Expand Chart
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAnalyzeClick}
                  disabled={isLoading}
                  className="px-8 py-3 bg-cyan-500 text-slate-900 font-bold rounded-full hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Chart'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-8 py-3 bg-slate-700 text-slate-200 font-bold rounded-full hover:bg-slate-600 transition-colors duration-300 disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Panel: Analysis */}
      {(analysis || isLoading || error) && (
        <div className="flex-shrink-0 border-2 border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur-sm shadow-2xl shadow-black/30">
          {isLoading && <Loader />}
          {error && (
            <div className="p-6">
              <div className="text-center bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
                <p className="font-semibold">Analysis Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          {analysis && !isLoading && <AnalysisDisplay result={analysis} />}
        </div>
      )}
      
      {imageFile && analysis && imageBase64 && (
        <ChartModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageSrc={URL.createObjectURL(imageFile)}
          imageBase64={imageBase64}
          mimeType={imageFile.type}
          result={analysis}
        />
      )}
    </div>
  );
};

export default App;