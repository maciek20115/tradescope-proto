import React from 'react';
import { AnalysisResult, Recommendation } from '../types';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const getRecommendationClasses = (recommendation: Recommendation) => {
  switch (recommendation) {
    case Recommendation.BUY:
      return 'bg-green-500/20 text-green-400 border-green-500';
    case Recommendation.SELL:
      return 'bg-red-500/20 text-red-400 border-red-500';
    case Recommendation.HOLD:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500';
  }
};

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-slate-700 rounded-full h-2.5">
    <div
      className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  const recommendationClasses = getRecommendationClasses(result.recommendation);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-sm animate-fade-in">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Recommendation and Confidence */}
        <div className="md:col-span-1 flex flex-col space-y-6">
          <div className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Recommendation</h3>
            <p className={`text-3xl font-bold px-4 py-2 rounded-md border ${recommendationClasses}`}>
              {result.recommendation}
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Confidence</h3>
            <div className="flex items-center space-x-4">
              <ConfidenceBar value={result.confidence} />
              <span className="text-xl font-semibold text-cyan-300">{result.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction and Rationale */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Prediction</h3>
            <p className="text-slate-300">{result.prediction}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Rationale</h3>
            <p className="text-slate-300 leading-relaxed text-justify">{result.rationale}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;