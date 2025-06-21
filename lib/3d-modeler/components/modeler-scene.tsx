"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Environment } from "@react-three/drei"
import { Suspense } from "react"
import { useModeler } from "./modeler-provider"
import { ObjectMesh } from "./object-mesh"
import { TransformControls } from "./transform-controls"
import { SubObjectRenderer } from "./sub-object-renderer"

interface ModelerSceneProps {
  showGrid?: boolean
  showAxes?: boolean
  backgroundColor?: string
  environmentPreset?:
    | "apartment"
    | "city"
    | "dawn"
    | "forest"
    | "lobby"
    | "night"
    | "park"
    | "studio"
    | "sunset"
    | "warehouse"
  gridSize?: number
  gridDivisions?: number
}

export function ModelerScene({
  showGrid = true,
  showAxes = true,
  backgroundColor = "#1a1a1a",
  environmentPreset = "studio",
  gridSize = 10,
  gridDivisions = 10,
}: ModelerSceneProps) {
  const { objects, selectedObjectId, transformMode, editMode, subObjectSelection } = useModeler()

  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      className="w-full h-full"
      style={{ background: backgroundColor }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        {/* Environment */}
        <Environment preset={environmentPreset} />

        {/* Grid */}
        {showGrid && (
          <Grid
            args={[gridSize * 2, gridSize * 2, gridDivisions, gridDivisions]}
            position={[0, -0.01, 0]}
            cellColor="#555555"
            sectionColor="#888888"
          />
        )}

        {/* Objects */}
        {objects.map((object) => (
          <ObjectMesh key={object.id} object={object} selected={object.id === selectedObjectId} />
        ))}

        {/* Sub-object selection rendering */}
        {editMode !== "object" && selectedObjectId && <SubObjectRenderer objectId={selectedObjectId} mode={editMode} />}

        {/* Transform controls */}
        {selectedObjectId && editMode === "object" && (
          <TransformControls objectId={selectedObjectId} mode={transformMode} />
        )}

        {/* Camera controls */}
        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={100}
        />
      </Suspense>
    </Canvas>
  )
}
