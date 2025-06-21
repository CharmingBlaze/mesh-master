"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import type { ModelerState, ModelerConfig } from "../core/types"
import { createModelerStore } from "../store/modeler-store"

const ModelerContext = createContext<ModelerState | null>(null)

interface ModelerProviderProps {
  children: ReactNode
  config?: Partial<ModelerConfig>
  store?: ModelerState
}

export function ModelerProvider({ children, config, store }: ModelerProviderProps) {
  console.log("ModelerProvider: Creating provider with config:", config)

  // Use provided store or create a new one with config
  const modelerStore = store || createModelerStore(config)()

  console.log("ModelerProvider: Store created:", {
    hasAddObject: typeof modelerStore.addObject === "function",
    objectsCount: modelerStore.objects.length,
    storeMethods: Object.keys(modelerStore),
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!config?.enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default browser shortcuts that might interfere
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "z":
            event.preventDefault()
            if (event.shiftKey) {
              modelerStore.redo()
            } else {
              modelerStore.undo()
            }
            break
          case "a":
            if (event.target === document.body) {
              event.preventDefault()
              // Select all logic would go here
            }
            break
          case "d":
            if (event.target === document.body) {
              event.preventDefault()
              if (modelerStore.selectedObjectId) {
                modelerStore.duplicateObject(modelerStore.selectedObjectId)
              }
            }
            break
        }
      }

      // Delete key
      if (event.key === "Delete" || event.key === "Backspace") {
        if (modelerStore.subObjectSelection) {
          modelerStore.deleteSelectedSubObjects()
        } else if (modelerStore.selectedObjectId) {
          modelerStore.removeObject(modelerStore.selectedObjectId)
        }
      }

      // Transform mode shortcuts
      switch (event.key.toLowerCase()) {
        case "g":
          if (event.target === document.body) {
            event.preventDefault()
            modelerStore.setTransformMode("translate")
          }
          break
        case "r":
          if (event.target === document.body) {
            event.preventDefault()
            modelerStore.setTransformMode("rotate")
          }
          break
        case "s":
          if (event.target === document.body) {
            event.preventDefault()
            modelerStore.setTransformMode("scale")
          }
          break
        case "tab":
          event.preventDefault()
          const modes = ["object", "vertex", "edge", "face"] as const
          const currentIndex = modes.indexOf(modelerStore.editMode)
          const nextMode = modes[(currentIndex + 1) % modes.length]
          modelerStore.setEditMode(nextMode)
          break
        case "escape":
          modelerStore.clearSubObjectSelection()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [config?.enableKeyboardShortcuts, modelerStore])

  return <ModelerContext.Provider value={modelerStore}>{children}</ModelerContext.Provider>
}

export function useModeler() {
  const context = useContext(ModelerContext)
  if (!context) {
    throw new Error("useModeler must be used within a ModelerProvider")
  }

  console.log("useModeler: Returning context with objects:", context.objects.length)
  return context
}
