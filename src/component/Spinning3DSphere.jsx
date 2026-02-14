import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function GlowingSphere() {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useFrame((state) => {
    if (meshRef.current) {
      // Auto rotation
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.008;

      // Mouse interaction - tilt based on mouse position
      const targetRotationX = (mousePosition.y * 0.5);
      const targetRotationY = (mousePosition.x * 0.5);
      
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.05;
      meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.05;
    }
  });

  const handleMouseMove = (e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    });
  };

  return (
    <Sphere
      ref={meshRef}
      args={[1.5, 64, 64]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerMove={handleMouseMove}
    >
      <MeshDistortMaterial
        color={hovered ? "#00ffff" : "#4a9eff"}
        emissive={hovered ? "#00aaaa" : "#1a5acc"}
        emissiveIntensity={hovered ? 0.8 : 0.4}
        roughness={0.2}
        metalness={0.8}
        distort={0.4}
        speed={2}
      />
    </Sphere>
  );
}

function GlowEffect() {
  return (
    <pointLight position={[2, 2, 2]} intensity={1} color="#00ffff" />
  );
}

function BackgroundParticles() {
  const particlesRef = useRef();
  const count = 50;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 10;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00ffff" transparent opacity={0.6} />
    </points>
  );
}

export default function Spinning3DSphere() {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a2a 100%)' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 75 }}>
        <ambientLight intensity={0.3} />
        <GlowEffect />
        <pointLight position={[-2, -2, -2]} intensity={0.5} color="#ff00ff" />
        <GlowingSphere />
        <BackgroundParticles />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        opacity: 0.7,
        pointerEvents: 'none'
      }}>
        Move mouse to interact • Scroll to zoom
      </div>
    </div>
  );
}
