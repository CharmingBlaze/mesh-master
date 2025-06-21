// Core type definitions for the 3D Modeler Library
export type TransformMode = "translate" | "rotate" | "scale"
export type EditMode = "object" | "vertex" | "edge" | "face"
export type ObjectType = "box" | "sphere" | "cylinder" | "plane" | "cone" | "torus" | "custom"

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Vector2 {
  x: number
  y: number
}

export interface Vertex {
  id: string
  position: Vector3
  selected: boolean
  normal?: Vector3
  uv?: Vector2
}

export interface Edge {
  id: string
  vertexIds: [string, string]
  selected: boolean
}

export interface Face {
  id: string
  vertexIds: string[]
  selected: boolean
  normal?: Vector3
  materialIndex?: number
}

export interface Material {
  id: string
  name: string
  color: string
  metalness?: number
  roughness?: number
  opacity?: number
  transparent?: boolean
  emissive?: string
  map?: string
  normalMap?: string
  roughnessMap?: string
  metalnessMap?: string
}

export interface ModelerObject {
  id: string
  name: string
  type: ObjectType
  position: Vector3
  rotation: Vector3
  scale: Vector3
  color: string
  wireframe: boolean
  visible: boolean
  vertices: Vertex[]
  edges: Edge[]
  faces: Face[]
  materials?: Material[]
  userData?: Record<string, any>
}

export interface SubObjectSelection {
  objectId: string
  type: "vertex" | "edge" | "face"
  ids: string[]
}

export interface TransformState {
  isTransforming: boolean
  startPositions: Map<string, Vector3>
  currentDelta: Vector3
}

export interface ModelerHistory {
  past: ModelerObject[][]
  future: ModelerObject[][]
}

export interface ModelerConfig {
  maxHistoryStates?: number
  autoSave?: boolean
  enableKeyboardShortcuts?: boolean
  defaultPrimitiveColor?: string
  gridSize?: number
  snapToGrid?: boolean
}

// Event types for the modeler
export interface ModelerEvents {
  objectAdded: (object: ModelerObject) => void
  objectRemoved: (objectId: string) => void
  objectSelected: (objectId: string | null) => void
  objectTransformed: (objectId: string, transform: Partial<ModelerObject>) => void
  editModeChanged: (mode: EditMode) => void
  transformModeChanged: (mode: TransformMode) => void
  subObjectSelected: (selection: SubObjectSelection | null) => void
  error: (error: string) => void
}

// Store state interface
export interface ModelerState {
  // Core state
  objects: ModelerObject[]
  selectedObjectId: string | null
  transformMode: TransformMode
  editMode: EditMode
  subObjectSelection: SubObjectSelection | null
  transformState: TransformState
  history: ModelerHistory
  isLoading: boolean
  error: string | null
  config: ModelerConfig

  // Actions
  addObject: (type: ObjectType, options?: any) => void
  addCustomObject: (object: ModelerObject) => void
  removeObject: (id: string) => void
  duplicateObject: (id: string) => void
  selectObject: (id: string | null) => void
  updateObject: (id: string, updates: Partial<ModelerObject>) => void

  setTransformMode: (mode: TransformMode) => void
  setEditMode: (mode: EditMode) => void

  selectSubObjects: (
    objectId: string,
    type: SubObjectSelection["type"],
    ids: string[],
    addToSelection?: boolean,
  ) => void
  clearSubObjectSelection: () => void
  deleteSelectedSubObjects: () => void

  startTransform: () => void
  updateTransform: (delta: Vector3) => void
  endTransform: () => void
  cancelTransform: () => void

  undo: () => void
  redo: () => void
  saveToHistory: () => void
  clearHistory: () => void

  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  resetScene: () => void
  updateConfig: (config: Partial<ModelerConfig>) => void
}
