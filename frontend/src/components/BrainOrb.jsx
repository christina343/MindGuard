import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function AnimatedOrb() {
  const meshRef = useRef()
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    timeRef.current += delta
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      meshRef.current.rotation.x = Math.sin(timeRef.current * 0.3) * 0.1
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.4, 64, 64]} />
      <meshStandardMaterial
        color="#3b82f6"
        roughness={0}
        metalness={0.2}
        opacity={0.85}
        transparent
      />
    </mesh>
  )
}

export default function BrainOrb() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4] }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8b5cf6" />
      <AnimatedOrb />
    </Canvas>
  )
}