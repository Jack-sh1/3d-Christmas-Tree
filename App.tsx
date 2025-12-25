
import React, { useState, useEffect, useRef } from 'react';
import TreeScene from './components/TreeScene';
import HandTracker from './components/HandTracker';

export type GestureState = 'OPEN' | 'CLOSED' | 'NONE';

const App: React.FC = () => {
  const [gesture, setGesture] = useState<GestureState>('CLOSED');
  const [loading, setLoading] = useState(true);

  const handleGestureUpdate = (state: GestureState) => {
    setGesture(state);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <TreeScene gesture={gesture} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              Interactive X-Mas Tree
            </h1>
            <p className="text-gray-400 mt-2">React + Three.js + MediaPipe</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-300">Current Gesture</p>
            <p className={`text-2xl font-bold ${gesture === 'OPEN' ? 'text-yellow-400' : gesture === 'CLOSED' ? 'text-green-400' : 'text-gray-500'}`}>
              {gesture === 'OPEN' ? '🖐️ Open (Scatter)' : gesture === 'CLOSED' ? '✊ Fist (Form Tree)' : 'Detecting...'}
            </p>
          </div>
        </header>

        <footer className="w-full flex justify-center pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-full border border-white/10 text-center max-w-md">
            <p className="text-sm text-gray-300">
              <span className="font-bold text-white">Instructions:</span> Open your hand to scatter the particles. Make a fist to assemble the Christmas tree.
            </p>
          </div>
        </footer>
      </div>

      {/* Hand Tracker Hidden UI */}
      <div className="absolute bottom-4 right-4 w-48 h-36 opacity-40 hover:opacity-100 transition-opacity rounded-xl overflow-hidden border border-white/20 z-20 pointer-events-auto">
        <HandTracker onGestureChange={handleGestureUpdate} onLoaded={() => setLoading(false)} />
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-light">Warming up the magic...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
