import React from 'react';
import { Game } from './components/Game';

const App: React.FC = () => {
  return (
    <div className="antialiased text-slate-200 select-none">
      <Game />
    </div>
  );
};

export default App;