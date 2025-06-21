"use client"

import { useRef, useEffect } from "react"
import { TransformControls as DreiTransformControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { Object3D } from "three"
import { useModeler } from "./modeler-provider"
import type { TransformMode } from "../core/types"

interface TransformControlsProps {
  objectId: string
  mode: TransformMode
}

export function TransformControls({ objectId, mode }: TransformControlsProps) {
  const { objects, updateObject } = useModeler()
  const { scene, camera } = useThree()
  const controlsRef = useRef<any>(null)
  const objectRef = useRef<Object3D>(new Object3D())

  // Find the object in the scene
  const object = objects.find((obj) => obj.id === objectId)

  // Update the dummy object with the current transform
  useEffect(() => {
    if (object && objectRef.current) {
      objectRef.current.position.set(object.position.x, object.position.y, object.position.z)
      objectRef.current.rotation.set(object.rotation.x, object.rotation.y, object.rotation.z)
      objectRef.current.scale.set(object.scale.x, object.scale.y, object.scale.z)
    }
  }, [object])

  // Add the dummy object to the scene
  useEffect(() => {
    scene.add(objectRef.current)
    return () => {
      scene.remove(objectRef.current)
    }
  }, [scene])

  // Handle transform changes
  const handleChange = () => {
    if (objectRef.current) {
      updateObject(objectId, {
        position: {
          x: objectRef.current.position.x,
          y: objectRef.current.position.y,
          z: objectRef.current.position.z,
        },
        rotation: {
          x: objectRef.current.rotation.x,
          y: objectRef.current.rotation.y,
          z: objectRef.current.rotation.z,
        },
        scale: {
          x: objectRef.current.scale.x,
          y: objectRef.current.scale.y,
          z: objectRef.current.scale.z,
        },
      })
    }
  }

  if (!object) return null

  return (
    <DreiTransformControls
      ref={controlsRef}
      object={objectRef.current}
      mode={mode}
      size={1}
      onObjectChange={handleChange}
    />
  )
}
