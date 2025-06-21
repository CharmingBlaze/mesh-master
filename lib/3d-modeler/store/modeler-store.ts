import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { ModelerState, ModelerObject, ObjectType, ModelerConfig, Vector3, SubObjectSelection } from "../core/types"
import { PrimitiveCreator } from "../core/primitive-creator"
import { validateGeometry } from "../utils/validation"

// Define the default config here to avoid circular imports
const DEFAULT_MODELER_CONFIG = {
  maxHistoryStates: 20,
  autoSave: true,
  enableKeyboardShortcuts: true,
  defaultPrimitiveColor: "#4a90e2",
  gridSize: 1,
  snapToGrid: false,
}

const initialState = {
  objects: [],
  selectedObjectId: null,
  transformMode: "translate" as const,
  editMode: "object" as const,
  subObjectSelection: null,
  transformState: {
    isTransforming: false,
    startPositions: new Map(),
    currentDelta: { x: 0, y: 0, z: 0 },
  },
  history: {
    past: [],
    future: [],
  },
  isLoading: false,
  error: null,
  config: DEFAULT_MODELER_CONFIG,
}

export function createModelerStore(config: Partial<ModelerConfig> = {}) {
  console.log("createModelerStore: Creating store with config:", config)

  return create<ModelerState>()(
    subscribeWithSelector((set, get) => {
      console.log("createModelerStore: Setting up store actions")

      const store = {
        ...initialState,
        config: { ...DEFAULT_MODELER_CONFIG, ...config },

        // Object Management
        addObject: (type: ObjectType, options = {}) => {
          console.log("=== STORE: addObject called ===")
          console.log("Store: Adding object type:", type)
          console.log("Store: Options:", options)
          console.log("Store: Current state before add:", {
            objectsCount: get().objects.length,
            config: get().config,
          })

          try {
            console.log("Store: Creating primitive...")
            const newObject = PrimitiveCreator.createPrimitive(type, {
              color: get().config.defaultPrimitiveColor,
              ...options,
            })

            console.log("Store: Primitive created successfully:", {
              id: newObject.id,
              name: newObject.name,
              type: newObject.type,
              verticesCount: newObject.vertices.length,
              facesCount: newObject.faces.length,
            })

            // Validate the object before adding
            if (!newObject || !newObject.id || !newObject.vertices || !newObject.faces) {
              throw new Error("Invalid object created - missing required properties")
            }

            console.log("Store: Object validation passed, updating state...")

            set((state) => {
              console.log("Store: In set function, current objects:", state.objects.length)

              const newState = {
                ...state,
                objects: [...state.objects, newObject],
                selectedObjectId: newObject.id,
                editMode: "object" as const,
                subObjectSelection: null,
                error: null,
              }

              console.log("Store: New state created with objects:", newState.objects.length)
              console.log("Store: New object added with ID:", newObject.id)

              if (state.config.autoSave) {
                setTimeout(() => {
                  console.log("Store: Auto-saving to history")
                  get().saveToHistory()
                }, 0)
              }

              return newState
            })

            console.log("Store: State updated successfully")
            console.log("Store: Final objects count:", get().objects.length)
          } catch (error) {
            console.error("Store: Error in addObject:", error)
            console.error("Store: Error stack:", error.stack)
            get().setError(`Failed to add ${type}: ${error.message}`)
          }
        },

        addCustomObject: (object: ModelerObject) => {
          console.log("Store: Adding custom object:", object.name)

          try {
            // Validate the object
            if (!validateGeometry(object)) {
              throw new Error("Invalid geometry")
            }

            set((state) => {
              const newState = {
                ...state,
                objects: [...state.objects, object],
                selectedObjectId: object.id,
                editMode: "object" as const,
                subObjectSelection: null,
                error: null,
              }

              if (state.config.autoSave) {
                setTimeout(() => get().saveToHistory(), 0)
              }
              return newState
            })

            console.log("Store: Custom object added successfully")
          } catch (error) {
            console.error("Store: Error adding custom object:", error)
            get().setError(`Failed to add object: ${error.message}`)
          }
        },

        removeObject: (id: string) => {
          set((state) => {
            const newState = {
              ...state,
              objects: state.objects.filter((obj) => obj.id !== id),
              selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
              editMode: "object" as const,
              subObjectSelection: null,
            }

            if (state.config.autoSave) {
              setTimeout(() => get().saveToHistory(), 0)
            }
            return newState
          })
        },

        duplicateObject: (id: string) => {
          const object = get().objects.find((obj) => obj.id === id)
          if (!object) return

          try {
            const duplicated = JSON.parse(JSON.stringify(object))
            duplicated.id = crypto.randomUUID()
            duplicated.name = `${object.name} Copy`
            duplicated.position = {
              x: object.position.x + 1,
              y: object.position.y,
              z: object.position.z,
            }

            // Regenerate IDs for all sub-objects
            duplicated.vertices = duplicated.vertices.map((v: any) => ({
              ...v,
              id: crypto.randomUUID(),
            }))
            duplicated.edges = duplicated.edges.map((e: any) => ({
              ...e,
              id: crypto.randomUUID(),
            }))
            duplicated.faces = duplicated.faces.map((f: any) => ({
              ...f,
              id: crypto.randomUUID(),
            }))

            get().addCustomObject(duplicated)
          } catch (error) {
            get().setError(`Failed to duplicate object: ${error.message}`)
          }
        },

        selectObject: (id: string | null) => {
          set({
            selectedObjectId: id,
            editMode: "object",
            subObjectSelection: null,
            transformState: initialState.transformState,
          })
        },

        updateObject: (id: string, updates: Partial<ModelerObject>) => {
          set((state) => {
            const objects = state.objects.map((obj) => {
              if (obj.id === id) {
                const updated = { ...obj, ...updates }

                // Validate geometry if vertices, edges, or faces were updated
                if (updates.vertices || updates.edges || updates.faces) {
                  if (!validateGeometry(updated)) {
                    console.error("Invalid geometry after update")
                    return obj // Return original object if validation fails
                  }
                }

                return updated
              }
              return obj
            })

            const newState = { ...state, objects, error: null }

            if (state.config.autoSave) {
              setTimeout(() => get().saveToHistory(), 0)
            }
            return newState
          })
        },

        // Transform & Edit Modes
        setTransformMode: (mode) => {
          set({ transformMode: mode })
        },

        setEditMode: (mode) => {
          set((state) => {
            const newState = {
              ...state,
              editMode: mode,
              subObjectSelection: null,
              transformState: initialState.transformState,
            }

            // Clear all sub-object selections when changing edit mode
            if (state.selectedObjectId) {
              const objects = state.objects.map((obj) => {
                if (obj.id === state.selectedObjectId) {
                  return {
                    ...obj,
                    vertices: obj.vertices.map((v) => ({ ...v, selected: false })),
                    edges: obj.edges.map((e) => ({ ...e, selected: false })),
                    faces: obj.faces.map((f) => ({ ...f, selected: false })),
                  }
                }
                return obj
              })
              newState.objects = objects
            }

            return newState
          })
        },

        // Sub-object Selection
        selectSubObjects: (
          objectId: string,
          type: SubObjectSelection["type"],
          ids: string[],
          addToSelection = false,
        ) => {
          set((state) => {
            const objects = state.objects.map((obj) => {
              if (obj.id === objectId) {
                const newObj = { ...obj }

                if (type === "vertex") {
                  newObj.vertices = obj.vertices.map((vertex) => ({
                    ...vertex,
                    selected: ids.includes(vertex.id) || (addToSelection && vertex.selected),
                  }))
                  if (!addToSelection) {
                    newObj.edges = obj.edges.map((e) => ({ ...e, selected: false }))
                    newObj.faces = obj.faces.map((f) => ({ ...f, selected: false }))
                  }
                } else if (type === "edge") {
                  newObj.edges = obj.edges.map((edge) => ({
                    ...edge,
                    selected: ids.includes(edge.id) || (addToSelection && edge.selected),
                  }))
                  if (!addToSelection) {
                    newObj.vertices = obj.vertices.map((v) => ({ ...v, selected: false }))
                    newObj.faces = obj.faces.map((f) => ({ ...f, selected: false }))
                  }
                } else if (type === "face") {
                  newObj.faces = obj.faces.map((face) => ({
                    ...face,
                    selected: ids.includes(face.id) || (addToSelection && face.selected),
                  }))
                  if (!addToSelection) {
                    newObj.vertices = obj.vertices.map((v) => ({ ...v, selected: false }))
                    newObj.edges = obj.edges.map((e) => ({ ...e, selected: false }))
                  }
                }

                return newObj
              }
              return obj
            })

            const selectedObject = objects.find((obj) => obj.id === objectId)
            let subObjectSelection: SubObjectSelection | null = null

            if (selectedObject) {
              let selectedIds: string[] = []

              if (type === "vertex") {
                selectedIds = selectedObject.vertices.filter((v) => v.selected).map((v) => v.id)
              } else if (type === "edge") {
                selectedIds = selectedObject.edges.filter((e) => e.selected).map((e) => e.id)
              } else if (type === "face") {
                selectedIds = selectedObject.faces.filter((f) => f.selected).map((f) => f.id)
              }

              if (selectedIds.length > 0) {
                subObjectSelection = { objectId, type, ids: selectedIds }
              }
            }

            return { ...state, objects, subObjectSelection }
          })
        },

        clearSubObjectSelection: () => {
          set((state) => {
            const objects = state.objects.map((obj) => ({
              ...obj,
              vertices: obj.vertices.map((v) => ({ ...v, selected: false })),
              edges: obj.edges.map((e) => ({ ...e, selected: false })),
              faces: obj.faces.map((f) => ({ ...f, selected: false })),
            }))

            return {
              ...state,
              objects,
              subObjectSelection: null,
              transformState: initialState.transformState,
            }
          })
        },

        deleteSelectedSubObjects: () => {
          const { subObjectSelection } = get()
          if (!subObjectSelection) return

          try {
            set((state) => {
              const objects = state.objects.map((obj) => {
                if (obj.id === subObjectSelection.objectId) {
                  let newObj = { ...obj }

                  if (subObjectSelection.type === "vertex") {
                    const remainingVertices = newObj.vertices.filter((v) => !subObjectSelection.ids.includes(v.id))
                    const remainingVertexIds = new Set(remainingVertices.map((v) => v.id))

                    const remainingEdges = newObj.edges.filter((e) =>
                      e.vertexIds.every((vId) => remainingVertexIds.has(vId)),
                    )

                    const remainingFaces = newObj.faces.filter((f) =>
                      f.vertexIds.every((vId) => remainingVertexIds.has(vId)),
                    )

                    newObj = { ...newObj, vertices: remainingVertices, edges: remainingEdges, faces: remainingFaces }
                  } else if (subObjectSelection.type === "edge") {
                    newObj.edges = newObj.edges.filter((e) => !subObjectSelection.ids.includes(e.id))
                  } else if (subObjectSelection.type === "face") {
                    newObj.faces = newObj.faces.filter((f) => !subObjectSelection.ids.includes(f.id))
                  }

                  // Validate geometry
                  if (!validateGeometry(newObj)) {
                    get().setError("Cannot delete: would create invalid geometry")
                    return obj
                  }

                  return newObj
                }
                return obj
              })

              const newState = {
                ...state,
                objects,
                subObjectSelection: null,
                error: null,
              }

              if (state.config.autoSave) {
                setTimeout(() => get().saveToHistory(), 0)
              }
              return newState
            })
          } catch (error) {
            get().setError(`Failed to delete sub-objects: ${error.message}`)
          }
        },

        // Transform Operations
        startTransform: () => {
          const { subObjectSelection, objects } = get()
          if (!subObjectSelection) return

          const selectedObject = objects.find((obj) => obj.id === subObjectSelection.objectId)
          if (!selectedObject) return

          const startPositions = new Map<string, Vector3>()

          if (subObjectSelection.type === "vertex") {
            selectedObject.vertices
              .filter((v) => subObjectSelection.ids.includes(v.id))
              .forEach((vertex) => {
                startPositions.set(vertex.id, { ...vertex.position })
              })
          }

          set((state) => ({
            ...state,
            transformState: {
              isTransforming: true,
              startPositions,
              currentDelta: { x: 0, y: 0, z: 0 },
            },
          }))
        },

        updateTransform: (delta: Vector3) => {
          const { transformState, subObjectSelection } = get()
          if (!transformState.isTransforming || !subObjectSelection) return

          set((state) => {
            const objects = state.objects.map((obj) => {
              if (obj.id === subObjectSelection.objectId && subObjectSelection.type === "vertex") {
                const vertices = obj.vertices.map((vertex) => {
                  if (subObjectSelection.ids.includes(vertex.id)) {
                    const startPos = transformState.startPositions.get(vertex.id)
                    if (startPos) {
                      return {
                        ...vertex,
                        position: {
                          x: startPos.x + delta.x,
                          y: startPos.y + delta.y,
                          z: startPos.z + delta.z,
                        },
                      }
                    }
                  }
                  return vertex
                })
                return { ...obj, vertices }
              }
              return obj
            })

            return {
              ...state,
              objects,
              transformState: {
                ...state.transformState,
                currentDelta: delta,
              },
            }
          })
        },

        endTransform: () => {
          set((state) => ({
            ...state,
            transformState: initialState.transformState,
          }))

          if (get().config.autoSave) {
            setTimeout(() => get().saveToHistory(), 0)
          }
        },

        cancelTransform: () => {
          const { transformState, subObjectSelection } = get()
          if (!transformState.isTransforming || !subObjectSelection) return

          // Restore original positions
          set((state) => {
            const objects = state.objects.map((obj) => {
              if (obj.id === subObjectSelection.objectId && subObjectSelection.type === "vertex") {
                const vertices = obj.vertices.map((vertex) => {
                  if (subObjectSelection.ids.includes(vertex.id)) {
                    const startPos = transformState.startPositions.get(vertex.id)
                    if (startPos) {
                      return { ...vertex, position: { ...startPos } }
                    }
                  }
                  return vertex
                })
                return { ...obj, vertices }
              }
              return obj
            })

            return {
              ...state,
              objects,
              transformState: initialState.transformState,
            }
          })
        },

        // History Management
        saveToHistory: () => {
          set((state) => {
            const currentObjects = JSON.parse(JSON.stringify(state.objects))
            const maxStates = state.config.maxHistoryStates || 20

            return {
              ...state,
              history: {
                past: [...state.history.past.slice(-(maxStates - 1)), currentObjects],
                future: [],
              },
            }
          })
        },

        undo: () => {
          set((state) => {
            const { past, future } = state.history
            if (past.length === 0) return state

            const previous = past[past.length - 1]
            const newPast = past.slice(0, past.length - 1)
            const currentObjects = JSON.parse(JSON.stringify(state.objects))

            return {
              ...state,
              objects: previous,
              selectedObjectId: null,
              editMode: "object",
              subObjectSelection: null,
              transformState: initialState.transformState,
              history: {
                past: newPast,
                future: [currentObjects, ...future.slice(0, 19)],
              },
            }
          })
        },

        redo: () => {
          set((state) => {
            const { past, future } = state.history
            if (future.length === 0) return state

            const next = future[0]
            const newFuture = future.slice(1)
            const currentObjects = JSON.parse(JSON.stringify(state.objects))

            return {
              ...state,
              objects: next,
              selectedObjectId: null,
              editMode: "object",
              subObjectSelection: null,
              transformState: initialState.transformState,
              history: {
                past: [...past, currentObjects],
                future: newFuture,
              },
            }
          })
        },

        clearHistory: () => {
          set((state) => ({
            ...state,
            history: { past: [], future: [] },
          }))
        },

        // Utility
        setError: (error) => {
          console.log("Store: Setting error:", error)
          set({ error })
          if (error) {
            setTimeout(() => set({ error: null }), 5000)
          }
        },

        setLoading: (loading) => {
          set({ isLoading: loading })
        },

        resetScene: () => {
          set({
            ...initialState,
            config: get().config,
          })
        },

        updateConfig: (newConfig) => {
          set((state) => ({
            ...state,
            config: { ...state.config, ...newConfig },
          }))
        },
      }

      console.log("createModelerStore: Store actions created:", Object.keys(store))
      return store
    }),
  )
}

// Default store instance
export const useModelerStore = createModelerStore()
