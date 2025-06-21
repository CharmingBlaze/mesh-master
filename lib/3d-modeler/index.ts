// Export all components and utilities
export * from "./core/types"
export * from "./core/geometry-utils"
export * from "./core/primitive-creator"
export * from "./components/modeler-provider"
export * from "./components/modeler-scene"
export * from "./components/modeler-ui"
export * from "./components/object-mesh"
export * from "./components/transform-controls"
export * from "./components/sub-object-renderer"
export * from "./store/modeler-store"
export * from "./utils/validation"
export * from "./utils/transforms"
export * from "./utils/geometry-converter"

// Default configuration
export const DEFAULT_MODELER_CONFIG = {
  maxHistoryStates: 20,
  autoSave: true,
  enableKeyboardShortcuts: true,
  defaultPrimitiveColor: "#4a90e2",
  gridSize: 10,
  snapToGrid: false,
}
