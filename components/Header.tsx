
import React from 'react';

const Header: React.FC = () => (
  <header className="py-6 text-center">
    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500">
      TradeScope
    </h1>
    <p className="mt-2 text-slate-400 text-sm md:text-base">AI-Powered Market Chart Analysis</p>
  </header>
);

export default Header;
