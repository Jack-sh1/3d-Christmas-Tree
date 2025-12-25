
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GestureState } from '../App';

interface TreeSceneProps {
  gesture: GestureState;
}

const PARTICLE_COUNT = 15000; // Increased for a denser tree
const TREE_HEIGHT = 14;
const TREE_RADIUS = 6;

// Helper to create a circular glow texture without external assets
const createCircleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const TreeScene: React.FC<TreeSceneProps> = ({ gesture }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<GestureState>(gesture);

  useEffect(() => {
    gestureRef.current = gesture;
  }, [gesture]);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    targetPositions: Float32Array;
    scatterPositions: Float32Array;
    star: THREE.Mesh;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Geometry & Attributes
    const geometry = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const scatterPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Tree Shape (Layered Cone)
      const isTrunk = i < PARTICLE_COUNT * 0.08;
      if (isTrunk) {
        const h = Math.random() * 2.5;
        const r = Math.random() * 0.6;
        const theta = Math.random() * Math.PI * 2;
        targetPositions[i * 3] = r * Math.cos(theta);
        targetPositions[i * 3 + 1] = h - (TREE_HEIGHT / 2) - 1.5;
        targetPositions[i * 3 + 2] = r * Math.sin(theta);
        colors[i * 3] = 0.45; colors[i * 3 + 1] = 0.25; colors[i * 3 + 2] = 0.1; // Brown
      } else {
        const layerCount = 6;
        const layer = Math.floor(Math.random() * layerCount);
        const v = (layer + Math.random()) / layerCount;
        const theta = 2 * Math.PI * Math.random();
        const height = v * TREE_HEIGHT;
        const layerMaxRadius = (1 - (v * 0.85)) * TREE_RADIUS;
        const r = (Math.pow(Math.random(), 0.5)) * layerMaxRadius;

        targetPositions[i * 3] = r * Math.cos(theta);
        targetPositions[i * 3 + 1] = height - TREE_HEIGHT / 2;
        targetPositions[i * 3 + 2] = r * Math.sin(theta);

        const isOrnament = Math.random() > 0.93;
        if (isOrnament) {
          const type = Math.random();
          if (type > 0.6) { // Bright Red
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.1; colors[i * 3 + 2] = 0.1;
          } else if (type > 0.3) { // Bright Gold
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.2;
          } else { // Icy Blue
            colors[i * 3] = 0.4; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
          }
        } else {
          colors[i * 3] = 0.05; colors[i * 3 + 1] = 0.6 + Math.random() * 0.4; colors[i * 3 + 2] = 0.1;
        }
      }

      // Initial positions start at the tree
      currentPositions[i * 3] = targetPositions[i * 3];
      currentPositions[i * 3 + 1] = targetPositions[i * 3 + 1];
      currentPositions[i * 3 + 2] = targetPositions[i * 3 + 2];

      // Scatter Positions
      const scatterDist = 30 + Math.random() * 40;
      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      scatterPositions[i * 3] = scatterDist * Math.sin(sPhi) * Math.cos(sTheta);
      scatterPositions[i * 3 + 1] = scatterDist * Math.sin(sPhi) * Math.sin(sTheta);
      scatterPositions[i * 3 + 2] = scatterDist * Math.cos(sPhi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 3. Material
    const texture = createCircleTexture();
    const material = new THREE.PointsMaterial({
      size: 0.35, // Increased size for visibility
      map: texture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 4. Star
    const starGeometry = new THREE.OctahedronGeometry(1.0, 0);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(0, TREE_HEIGHT / 2 + 1, 0);
    scene.add(star);

    camera.position.z = 40;

    sceneRef.current = {
      scene, camera, renderer, particles, targetPositions, scatterPositions, star
    };

    // 5. Animation
    let animationId: number;
    let rotationY = 0;
    let rotationX = 0;
    let curRotSpeedY = 0.005;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (sceneRef.current) {
        const { particles, targetPositions, scatterPositions, star, renderer, scene, camera } = sceneRef.current;
        const posAttr = particles.geometry.attributes.position;
        const positions = posAttr.array as Float32Array;
        const currentGesture = gestureRef.current;
        
        // Dynamic speed logic
        // We move faster when opening, slower when closing for a "magic" gathering feel
        const lerpFactor = currentGesture === 'OPEN' ? 0.1 : 0.03;
        
        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          const target = currentGesture === 'OPEN' ? scatterPositions[i] : targetPositions[i];
          positions[i] += (target - positions[i]) * lerpFactor;
        }
        posAttr.needsUpdate = true;

        // Rotation
        const targetRotSpeedY = currentGesture === 'OPEN' ? 0.08 : 0.008;
        curRotSpeedY += (targetRotSpeedY - curRotSpeedY) * 0.05;
        rotationY += curRotSpeedY;
        
        // Multi-axis wobble when open
        if (currentGesture === 'OPEN') {
          rotationX += 0.02;
        } else {
          rotationX += (0 - rotationX) * 0.05;
        }
        
        particles.rotation.y = rotationY;
        particles.rotation.x = rotationX;
        
        // Star logic
        star.rotation.y += 0.05;
        const starTargetY = currentGesture === 'OPEN' ? 80 : (TREE_HEIGHT / 2 + 1);
        star.position.y += (starTargetY - star.position.y) * 0.05;
        star.visible = star.position.y < 60;

        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      material.dispose();
      geometry.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      if (texture) texture.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default TreeScene;
