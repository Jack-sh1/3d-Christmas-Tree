
import React, { useState, useEffect, useRef } from 'react';
import TreeScene from './components/TreeScene';
import HandTracker from './components/HandTracker';

export type GestureState = 'OPEN' | 'CLOSED' | 'NONE';

const App: React.FC = () => {
  const [gesture, setGesture] = useState<GestureState>('CLOSED');
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGestureUpdate = (state: GestureState) => {
    setGesture(state);
  };

  const startExperience = () => {
    setHasStarted(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Audio play blocked", e));
    }
  };

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden">
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
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-red-500">
              圣诞快乐 my girl
            </h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">React + Three.js + MediaPipe</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Music Toggle */}
            <button 
              onClick={toggleMusic}
              className={`p-3 rounded-full transition-all duration-300 border backdrop-blur-md ${isPlaying ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 border-white/20 opacity-60'}`}
            >
              {isPlaying ? <span className="text-xl">🎵</span> : <span className="text-xl">🔇</span>}
            </button>

            {/* Gesture Status */}
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 hidden md:block">
              <p className="text-[10px] uppercase tracking-tighter text-gray-400">Gesture</p>
              <p className={`text-lg font-bold ${gesture === 'OPEN' ? 'text-yellow-400' : 'text-green-400'}`}>
                {gesture === 'OPEN' ? '🖐️ Open' : '✊ Fist'}
              </p>
            </div>
          </div>
        </header>

        <footer className="w-full flex justify-center pointer-events-auto mb-4">
          <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 text-center max-w-lg shadow-2xl">
            <p className="text-xs md:text-sm text-gray-300">
              <span className="font-bold text-white">🎄 互动指南:</span> 
              握拳 <span className="text-green-400">✊</span> 聚集树木，张手 <span className="text-yellow-400">🖐️</span> 散开粒子
            </p>
          </div>
        </footer>
      </div>

      {/* Hand Tracker */}
      <div className="absolute bottom-4 right-4 w-40 h-30 opacity-40 hover:opacity-100 transition-opacity rounded-lg overflow-hidden border border-white/20 z-20 pointer-events-auto">
        {hasStarted && <HandTracker onGestureChange={handleGestureUpdate} onLoaded={() => setLoading(false)} />}
      </div>

      {/* Initial Start Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-[60] backdrop-blur-sm">
          <div className="text-center p-10 border border-white/10 rounded-3xl bg-white/5">
            <h2 className="text-5xl mb-6">🎄</h2>
            <button 
              onClick={startExperience}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-400 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(34,197,94,0.5)]"
            >
              点击开启奇妙圣诞
            </button>
            <p className="text-gray-500 mt-4 text-sm">需要开启摄像头权限以进行手势互动</p>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {hasStarted && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-light tracking-widest text-green-400 animate-pulse uppercase">魔法加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
