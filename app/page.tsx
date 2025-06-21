"use client"

import { ModelerProvider } from "@/lib/3d-modeler/components/modeler-provider"
import { ModelerScene } from "@/lib/3d-modeler/components/modeler-scene"
import { ModelerUI } from "@/lib/3d-modeler/components/modeler-ui"
import { ThemeProvider } from "@/components/theme-provider"
import { useModeler } from "@/lib/3d-modeler/components/modeler-provider"

function DebugInfo() {
  const { objects } = useModeler()

  return (
    <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm font-mono">
      Objects: {objects.length}
    </div>
  )
}

export default function Home() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="modeler-theme">
      <div className="h-screen flex bg-background">
        <ModelerProvider
          config={{
            enableKeyboardShortcuts: true,
            autoSave: true,
            maxHistoryStates: 50,
            defaultPrimitiveColor: "#4a90e2",
          }}
        >
          {/* 3D Scene Area */}
          <div className="flex-1 relative">
            <ModelerScene />
            <DebugInfo />
          </div>

          {/* UI Panel */}
          <ModelerUI className="w-80 border-l" />
        </ModelerProvider>
      </div>
    </ThemeProvider>
  )
}
