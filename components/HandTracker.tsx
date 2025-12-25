
import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { GestureState } from '../App';

interface HandTrackerProps {
  onGestureChange: (state: GestureState) => void;
  onLoaded: () => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGestureChange, onLoaded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let lastVideoTime = -1;

    const setupMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      landmarkerRef.current = handLandmarker;
      onLoaded();
      startCamera();
    };

    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          requestAnimationFrame(predictLoop);
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    const predictLoop = async () => {
      if (!videoRef.current || !landmarkerRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = landmarkerRef.current.detectForVideo(video, performance.now());

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.landmarks && results.landmarks.length > 0) {
          const drawingUtils = new DrawingUtils(ctx);
          for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 5
            });
            drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
            
            // Gesture Detection logic
            // 0 is wrist, 4 thumb, 8 index, 12 middle, 16 ring, 20 pinky
            const isFingersClosed = (
              landmarks[8].y > landmarks[6].y && 
              landmarks[12].y > landmarks[10].y && 
              landmarks[16].y > landmarks[14].y && 
              landmarks[20].y > landmarks[18].y
            );

            const isFingersOpen = (
              landmarks[8].y < landmarks[6].y && 
              landmarks[12].y < landmarks[10].y && 
              landmarks[16].y < landmarks[14].y && 
              landmarks[20].y < landmarks[18].y
            );

            if (isFingersOpen) {
              onGestureChange('OPEN');
            } else if (isFingersClosed) {
              onGestureChange('CLOSED');
            }
          }
        } else {
          onGestureChange('NONE');
        }
      }

      requestAnimationFrame(predictLoop);
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  );
};

export default HandTracker;
