"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"
import { useModeler } from "./modeler-provider"
import { convertToBufferGeometry } from "../utils/geometry-converter"
import type { ModelerObject } from "../core/types"

interface ObjectMeshProps {
  object: ModelerObject
  selected: boolean
}

export function ObjectMesh({ object, selected }: ObjectMeshProps) {
  const meshRef = useRef<Mesh>(null)
  const { selectObject } = useModeler()

  // Convert our object data to Three.js buffer geometry
  const geometry = useMemo(() => {
    return convertToBufferGeometry(object)
  }, [object])

  // Handle selection
  const handleClick = (e: any) => {
    e.stopPropagation()
    selectObject(object.id)
  }

  // Update position, rotation, scale
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(object.position.x, object.position.y, object.position.z)
      meshRef.current.rotation.set(object.rotation.x, object.rotation.y, object.rotation.z)
      meshRef.current.scale.set(object.scale.x, object.scale.y, object.scale.z)
      meshRef.current.visible = object.visible
    }
  })

  if (!object.visible) return null

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={object.color}
        wireframe={object.wireframe}
        metalness={0.1}
        roughness={0.8}
        transparent={true}
        opacity={selected ? 0.9 : 1}
        emissive={selected ? "#222222" : "#000000"}
      />
    </mesh>
  )
}
