
import React from 'react';

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4 my-8">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500/20 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-t-4 border-cyan-500 rounded-full animate-spin"></div>
    </div>
    <p className="text-cyan-400 font-semibold tracking-wider">Analyzing Chart...</p>
  </div>
);

export default Loader;
