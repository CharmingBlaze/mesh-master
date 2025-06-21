"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { ModelerProvider, ModelerScene, ModelerUI } from "./lib/3d-modeler"
import "./lib/3d-modeler/styles/modeler.css"

export default function ModelerApp() {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <ModelerProvider config={{ defaultPrimitiveColor: "#ff6b6b" }}>
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
          <ModelerScene showGrid={true} environmentPreset="studio" />
          <OrbitControls makeDefault />
        </Canvas>

        <ModelerUI className="custom-modeler-ui" />
      </ModelerProvider>
    </div>
  )
}
