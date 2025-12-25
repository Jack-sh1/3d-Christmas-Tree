
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GestureState } from '../App';

interface TreeSceneProps {
  gesture: GestureState;
}

const PARTICLE_COUNT = 15000;
const TREE_HEIGHT = 14;
const TREE_RADIUS = 6;

const createCircleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const scatterPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Logic to define tree and scatter shapes
      const isTrunk = i < PARTICLE_COUNT * 0.1;
      if (isTrunk) {
        // Trunk positions
        const h = Math.random() * 2.5;
        const r = Math.random() * 0.7;
        const theta = Math.random() * Math.PI * 2;
        targetPositions[i * 3] = r * Math.cos(theta);
        targetPositions[i * 3 + 1] = h - (TREE_HEIGHT / 2) - 1;
        targetPositions[i * 3 + 2] = r * Math.sin(theta);
        colors[i * 3] = 0.4; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.1; // Brown
      } else {
        // Foliage positions
        const v = Math.random();
        const height = v * TREE_HEIGHT;
        const layerMaxRadius = (1 - v) * TREE_RADIUS;
        const r = Math.random() * layerMaxRadius;
        const theta = Math.random() * Math.PI * 2;
        targetPositions[i * 3] = r * Math.cos(theta);
        targetPositions[i * 3 + 1] = height - TREE_HEIGHT / 2;
        targetPositions[i * 3 + 2] = r * Math.sin(theta);
        
        // Greenish with random "ornaments"
        if (Math.random() > 0.9) {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.2; // Red ornament
        } else {
          colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.5 + Math.random() * 0.5; colors[i * 3 + 2] = 0.1;
        }
      }

      // Initial scatter positions
      const radius = 40 + Math.random() * 20;
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      scatterPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      scatterPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      scatterPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Start at tree
      currentPositions[i * 3] = targetPositions[i * 3];
      currentPositions[i * 3 + 1] = targetPositions[i * 3 + 1];
      currentPositions[i * 3 + 2] = targetPositions[i * 3 + 2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const texture = createCircleTexture();
    const material = new THREE.PointsMaterial({
      size: 0.25,
      map: texture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const starGeo = new THREE.OctahedronGeometry(1, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, TREE_HEIGHT / 2 + 0.5, 0);
    scene.add(star);

    camera.position.z = 35;

    sceneRef.current = { scene, camera, renderer, particles, targetPositions, scatterPositions, star };

    let animationId: number;
    let rotation = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;

      const { renderer, scene, camera, particles, targetPositions, scatterPositions, star } = sceneRef.current;
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const currentGesture = gestureRef.current;

      const speed = currentGesture === 'OPEN' ? 0.08 : 0.03;
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        const target = currentGesture === 'OPEN' ? scatterPositions[i] : targetPositions[i];
        positions[i] += (target - positions[i]) * speed;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      rotation += (currentGesture === 'OPEN' ? 0.05 : 0.005);
      particles.rotation.y = rotation;
      star.rotation.y = rotation * 2;
      
      // Floating effect for star
      star.position.y = (TREE_HEIGHT / 2 + 0.5) + Math.sin(performance.now() * 0.002) * 0.2;

      renderer.render(scene, camera);
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
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      starGeo.dispose();
      starMat.dispose();
      if (texture) texture.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default TreeScene;
