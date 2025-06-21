"use client"

import { useMemo } from "react"
import { useModeler } from "./modeler-provider"
import { Points, Line } from "@react-three/drei"
import type { EditMode } from "../core/types"

interface SubObjectRendererProps {
  objectId: string
  mode: EditMode
}

export function SubObjectRenderer({ objectId, mode }: SubObjectRendererProps) {
  const { objects, selectSubObjects, subObjectSelection } = useModeler()
  const object = objects.find((obj) => obj.id === objectId)

  const vertexPositions = useMemo(() => {
    if (!object) return []
    return object.vertices.map((v) => [v.position.x, v.position.y, v.position.z])
  }, [object?.vertices])

  const edgePositions = useMemo(() => {
    if (!object) return []
    return object.edges.map((edge) => {
      const v1 = object.vertices.find((v) => v.id === edge.vertexIds[0])
      const v2 = object.vertices.find((v) => v.id === edge.vertexIds[1])
      if (!v1 || !v2) return []
      return [
        [v1.position.x, v1.position.y, v1.position.z],
        [v2.position.x, v2.position.y, v2.position.z],
      ]
    })
  }, [object?.edges, object?.vertices])

  // Handle vertex selection
  const handleVertexClick = (index: number) => {
    if (!object) return
    const vertex = object.vertices[index]
    if (vertex) {
      selectSubObjects(objectId, "vertex", [vertex.id])
    }
  }

  // Handle edge selection
  const handleEdgeClick = (index: number) => {
    if (!object) return
    const edge = object.edges[index]
    if (edge) {
      selectSubObjects(objectId, "edge", [edge.id])
    }
  }

  // Determine which sub-objects are selected
  const selectedVertexIndices = useMemo(() => {
    if (!object) return []
    if (subObjectSelection && subObjectSelection.objectId === objectId && subObjectSelection.type === "vertex") {
      return object.vertices.map((v, i) => (subObjectSelection.ids.includes(v.id) ? i : -1)).filter((i) => i !== -1)
    }
    return []
  }, [subObjectSelection, object?.vertices, objectId])

  const selectedEdgeIndices = useMemo(() => {
    if (!object) return []
    if (subObjectSelection && subObjectSelection.objectId === objectId && subObjectSelection.type === "edge") {
      return object.edges.map((e, i) => (subObjectSelection.ids.includes(e.id) ? i : -1)).filter((i) => i !== -1)
    }
    return []
  }, [subObjectSelection, object?.edges, objectId])

  if (!object) return null

  return (
    <group
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
    >
      {/* Render vertices */}
      {mode === "vertex" && (
        <Points positions={vertexPositions} stride={3} onClick={(e) => handleVertexClick(e.index)}>
          <pointsMaterial size={5} sizeAttenuation={false} color="#ffffff" transparent opacity={0.8} />
        </Points>
      )}

      {/* Render selected vertices */}
      {mode === "vertex" &&
        selectedVertexIndices.map((index) => {
          const vertex = object.vertices[index]
          return (
            <mesh
              key={vertex.id}
              position={[vertex.position.x, vertex.position.y, vertex.position.z]}
              onClick={() => handleVertexClick(index)}
            >
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          )
        })}

      {/* Render edges */}
      {mode === "edge" &&
        edgePositions.map((points, i) => {
          const isSelected = selectedEdgeIndices.includes(i)
          return (
            <Line
              key={object.edges[i].id}
              points={points as any}
              color={isSelected ? "#ffff00" : "#ffffff"}
              lineWidth={isSelected ? 3 : 1}
              onClick={() => handleEdgeClick(i)}
            />
          )
        })}
    </group>
  )
}
