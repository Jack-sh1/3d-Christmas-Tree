
import React, { useState, useEffect, useRef } from 'react';
import TreeScene from './components/TreeScene';
import HandTracker from './components/HandTracker';

export type GestureState = 'OPEN' | 'CLOSED' | 'NONE';

const App: React.FC = () => {
  const [gesture, setGesture] = useState<GestureState>('CLOSED');
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGestureUpdate = (state: GestureState) => {
    setGesture(state);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Start music on first interaction if blocked
  useEffect(() => {
    const handleFirstClick = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans">
      {/* Background Audio */}
      <audio 
        ref={audioRef} 
        loop 
        src="https://cdn.pixabay.com/download/audio/2022/11/22/audio_1049362c79.mp3?filename=we-wish-you-a-merry-christmas-126685.mp3"
      />

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <TreeScene gesture={gesture} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              圣诞快乐 my girl
            </h1>
            <p className="text-gray-400 mt-2">React + Three.js + MediaPipe</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Music Toggle */}
            <button 
              onClick={toggleMusic}
              className={`p-4 rounded-full transition-all duration-300 border backdrop-blur-md ${isPlaying ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 border-white/20 opacity-60'}`}
              title={isPlaying ? "Pause Music" : "Play Music"}
            >
              {isPlaying ? (
                <div className="relative">
                  <span className="text-xl">🎵</span>
                  <span className="absolute -inset-1 rounded-full animate-ping bg-green-400 opacity-20"></span>
                </div>
              ) : (
                <span className="text-xl">🔇</span>
              )}
            </button>

            {/* Gesture Status */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[180px]">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Gesture Status</p>
              <p className={`text-xl font-bold mt-1 ${gesture === 'OPEN' ? 'text-yellow-400' : gesture === 'CLOSED' ? 'text-green-400' : 'text-gray-500'}`}>
                {gesture === 'OPEN' ? '🖐️ Open' : gesture === 'CLOSED' ? '✊ Fist' : 'Detecting...'}
              </p>
            </div>
          </div>
        </header>

        <footer className="w-full flex justify-center pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 text-center max-w-lg shadow-2xl">
            <p className="text-sm text-gray-300">
              <span className="font-bold text-white mr-2">🎄 Interactive Guide:</span> 
              Make a <span className="text-green-400 font-bold">✊ Fist</span> to build the tree. 
              <span className="mx-2">|</span> 
              Open <span className="text-yellow-400 font-bold">🖐️ Hand</span> to blast particles!
            </p>
          </div>
        </footer>
      </div>

      {/* Hand Tracker Mini Window */}
      <div className="absolute bottom-4 right-4 w-48 h-36 opacity-30 hover:opacity-100 transition-all duration-500 rounded-xl overflow-hidden border border-white/20 shadow-2xl z-20 pointer-events-auto">
        <HandTracker onGestureChange={handleGestureUpdate} onLoaded={() => setLoading(false)} />
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]"></div>
            <p className="text-2xl font-light tracking-widest text-green-400 animate-pulse">CREATING MAGIC...</p>
            <p className="text-gray-500 mt-2 text-sm uppercase">Please allow camera access</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
